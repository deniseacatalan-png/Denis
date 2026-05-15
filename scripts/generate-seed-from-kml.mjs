import fs from "node:fs";
import path from "node:path";
import { parseKmlProperties } from "./lib/kml-properties.mjs";

const cwd = process.cwd();
const kmlPath = path.join(cwd, "public", "webpropiedades.kml");
const publicDir = path.join(cwd, "public");
const outputPath = path.join(cwd, "supabase", "seed.sql");

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  return Number.isFinite(Number(value)) ? String(Number(value)) : "null";
}

function sqlBoolean(value) {
  return value ? "true" : "false";
}

function propertyValues(property) {
  return [
    sqlString(property.kmlId),
    sqlString(property.title),
    sqlString(property.slug),
    sqlString(property.location),
    sqlString(property.price),
    sqlString(property.area),
    sqlString(property.category),
    sqlNumber(property.latitude),
    sqlNumber(property.longitude),
    sqlString(property.markerColor),
    sqlString(property.summary),
    sqlString(property.descriptionHtml),
    sqlString(property.rawDescription),
    sqlBoolean(property.isPublished),
    sqlNumber(property.displayOrder)
  ].join(", ");
}

function imageValues(property) {
  return property.images
    .map((url, index) => `(${sqlString(url)}, ${sqlString(property.title)}, ${index})`)
    .join(",\n    ");
}

function upsertStatement(property) {
  const columns = [
    "kml_id",
    "title",
    "slug",
    "location",
    "price",
    "area",
    "category",
    "latitude",
    "longitude",
    "marker_color",
    "summary",
    "description_html",
    "raw_description",
    "is_published",
    "display_order"
  ];

  const updateColumns = columns
    .filter((column) => column !== "kml_id")
    .map((column) => `${column} = excluded.${column}`)
    .join(",\n      ");

  const upsert = `insert into public.properties (${columns.join(", ")})
    values (${propertyValues(property)})
    on conflict (kml_id) do update set
      ${updateColumns},
      updated_at = now()
    returning id`;

  if (!property.images.length) {
    return `with upserted as (
  ${upsert}
)
delete from public.property_images
where property_id in (select id from upserted);`;
  }

  return `with upserted as (
  ${upsert}
),
deleted as (
  delete from public.property_images
  where property_id in (select id from upserted)
)
insert into public.property_images (property_id, url, alt, sort_order)
select upserted.id, image_rows.url, image_rows.alt, image_rows.sort_order
from upserted
cross join (
  values
    ${imageValues(property)}
) as image_rows(url, alt, sort_order);`;
}

const properties = parseKmlProperties({ kmlPath, publicDir });
const seedSql = `-- Generated from public/webpropiedades.kml.
-- Run after Supabase migrations.

begin;

${properties.map(upsertStatement).join("\n\n")}

commit;
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, seedSql);

console.log(`Generated ${outputPath}`);
console.log(`Properties: ${properties.length}`);
