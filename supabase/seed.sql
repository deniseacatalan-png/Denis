-- Generated from public/webpropiedades.kml.
-- Run after Supabase migrations.

begin;

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('0EDCA457B836033677E8', 'LOTE OASIS', 'lote-oasis', 'San Martin de los Andes, Neuquen', 'USD 1.800.000', '7.385,81 m²', 'vendido', -40.15260090431199, -71.32409444615101, '#000000', 'Terreno en Oasis Bajo – 7.385,81 m² 📍 Ubicación privilegiada Situada en un área de alta categoría residencial y turística , rodeada de un entorno natural excepcional. Su cercanía con el centro de la ciudad y...', '<p class="MsoNormal"><b><i><u>Terreno en Oasis Bajo – 7.385,81 m²</u></i></b><br></p><h3><b>📍 Ubicación privilegiada</b><br></h3><p>Situada en un área de <b>alta categoría residencial y turística</b>, rodeada de un entorno natural excepcional. Su cercanía con el centro de la ciudad y su acceso a servicios esenciales la convierten en una oportunidad inigualable para inversión y desarrollo.<br></p><h3><b>📐 Zonificación y potencial de desarrollo</b><br></h3><p><br></p><div>📌 <b>Superficie total:</b> 7.385,81 m²<br></div><div>📌 <b>Factor de Ocupación del Suelo (FOS):</b> 30%<br></div><div>📌 <b>Altura máxima permitida:</b> 9,50 metros (planta baja y dos pisos altos)<br></div><div>📌 <b>Frente mínimo del lote:</b> 15 metros<br></div><div>📌 <b>Superficie mínima de lote:</b> 600 m²<br></div><div>📌 <b>Retiros:</b><br></div><p><br></p><ul><li><p><b>Fondo:</b> 10 metros (máximo)<br></p></li><li><p><b>Frente:</b> 3 metros en pendientes menores a 15º y 5 metros en pendientes mayores a 15º<br></p></li><li><p><b>Laterales:</b> 3 metros (o unilateral en lotes menores a 15 metros de frente)<br></p></li></ul><h3><b>🏡 Usos permitidos</b><br></h3><p><br></p><div>✅ <b>Residencial</b>: Viviendas unifamiliares y multifamiliares.<br></div><div>✅ <b>Turístico</b>: Hosterías <b>2 y 3 estrellas</b>, cabañas <b>2 y 3 estrellas</b>, <b>apart-hotel 3 estrellas</b>.<br></div><div>✅ <b>Otros usos condicionados</b>: Hogar infantil, residencia geriátrica.<br></div><div>✅ <b>Estacionamiento</b>: 100% de las unidades funcionales deben contar con espacio propio.<br></div><p><br></p><h3><b>🏔️ Densidad de construcción según pendiente</b><br></h3><p><br></p><div>✔ Para lotes con <b>pendiente hasta 12%</b>: 1 unidad cada <b>150 m²</b><br></div><div>✔ Para lotes con <b>pendiente de 13% a 20%</b>: 1 unidad cada <b>180 m²</b><br></div><div>✔ Para lotes con <b>pendiente de 21% a 50%</b>: 1 unidad cada <b>200 m²</b><br></div><div>✔ Para lotes con <b>pendiente mayor al 50%</b>: <b>Una única construcción principal por predio</b>, según estudio ambiental.<br></div><p><br></p><h3><b>🌿 Entorno y valor estratégico</b><br></h3><p>Este lote es <b>el único con estas características en toda la ciudad</b>, combinando <b>privacidad, exclusividad y un marco natural incomparable</b>. El Arroyo Trabunco aporta un valor paisajístico y ambiental único, ideal para proyectos que buscan integrar naturaleza y confort.<br></p><p>💰 <b>Valor: USD 1.800.000</b><br></p><div><br></div>', 'Terreno en Oasis Bajo – 7.385,81 m² 📍 Ubicación privilegiada Situada en un área de alta categoría residencial y turística , rodeada de un entorno natural excepcional. Su cercanía con el centro de la ciudad y su acceso a servicios esenciales la convierten en una oportunidad inigualable para inversión y desarrollo. 📐 Zonificación y potencial de desarrollo 📌 Superficie total: 7.385,81 m² 📌 Factor de Ocupación del Suelo (FOS): 30% 📌 Altura máxima permitida: 9,50 metros (planta baja y dos pisos altos) 📌 Frente mínimo del lote: 15 metros 📌 Superficie mínima de lote: 600 m² 📌 Retiros: Fondo: 10 metros (máximo) Frente: 3 metros en pendientes menores a 15º y 5 metros en pendientes mayores a 15º Laterales: 3 metros (o unilateral en lotes menores a 15 metros de frente) 🏡 Usos permitidos ✅ Residencial : Viviendas unifamiliares y multifamiliares. ✅ Turístico : Hosterías 2 y 3 estrellas , cabañas 2 y 3 estrellas , apart-hotel 3 estrellas . ✅ Otros usos condicionados : Hogar infantil, residencia geriátrica. ✅ Estacionamiento : 100% de las unidades funcionales deben contar con espacio propio. 🏔️ Densidad de construcción según pendiente ✔ Para lotes con pendiente hasta 12% : 1 unidad cada 150 m² ✔ Para lotes con pendiente de 13% a 20% : 1 unidad cada 180 m² ✔ Para lotes con pendiente de 21% a 50% : 1 unidad cada 200 m² ✔ Para lotes con pendiente mayor al 50% : Una única construcción principal por predio , según estudio ambiental. 🌿 Entorno y valor estratégico Este lote es el único con estas características en toda la ciudad , combinando privacidad, exclusividad y un marco natural incomparable . El Arroyo Trabunco aporta un valor paisajístico y ambiental único, ideal para proyectos que buscan integrar naturaleza y confort. 💰 Valor: USD 1.800.000', false, 0)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('0D4C5A919B3603399807', 'LOTES LA LONJA', 'lotes-la-lonja', 'Zona elevada con vistas panorámicas a los cerros y valles de San Martín de los Andes', 'USD 60.000', '3.000 m²', 'vendido', -40.14663754435229, -71.30057092546788, '#000000', 'POR MOMENTO NO SE VENDE Terreno La Lonja con vistas panorámicas a La Vega – 2.500-3.000 m² Ubicación: Zona elevada con vistas panorámicas a los cerros y valles de San Martín de los Andes Servicios: Luz y agua...', '<p class="MsoNormal"><b><i><u>POR MOMENTO NO SE VENDE</u></i></b><br></p><div><b><i><u>Terreno La Lonja con vistas panorámicas a La Vega –
2.500-3.000 m²</u></i></b><br></div><p class="MsoNormal"><br></p><div><span>&nbsp;</span><b>Ubicación:</b> Zona elevada con vistas panorámicas a los cerros y valles de San Martín de los
Andes<br></div><div><span>&nbsp;</span><b>Servicios:</b> Luz y agua disponibles<br></div><div><span>&nbsp;</span><b>Características:</b> Excelente
orientación solar, ideal para proyectos de cabañas o vivienda permanente<br></div><div><span>&nbsp;</span><b>Valor:</b> USD 60.000 - 75.000<br></div><div><span>&nbsp;</span><b>Financiación:</b> Entrega del 30-40%
y saldo en 3-4 cuotas<br></div><p>Resumen de la normativa aplicable a la construcción en la zona <b>El Faldeo de la Vega Sur 1 (FVS1)</b> según la ordenanza mencionada:<br></p><h3><b>Clasificación del suelo:</b><br></h3><ul><li><p>Se considera <b>suelo urbanizable</b>, excepto la <b>Banda de la Meseta Superior</b>, que es <b>suelo rural de urbanización diferida</b>.<br></p></li><li><p>Se permiten <b>urbanizaciones cerradas de montaña</b> bajo ciertas condiciones.<br></p></li></ul><h3><b>Parámetros de construcción en nuevas divisiones y fraccionamientos</b><br></h3><p>Dado que los lotes indicados tienen <b>pendientes mayores al 25%</b>, no se admite la subdivisión de terrenos y se aplican las siguientes restricciones:<br></p><h4><b>1. Altura y Ocupación:</b><br></h4><ul><li><p><b>Altura máxima de edificación:</b> 9,50 metros en la cumbrera más alta.<br></p></li><li><p><b>Factor de Ocupación del Suelo (FOS):</b><br></p><ul><li><p>15% en la <b>Banda Intermedia</b>.<br></p></li><li><p>20% en las <b>Bandejas o pequeñas mesetas</b>.<br></p></li><li><p>En la <b>Banda de la Meseta Superior</b>, se permite una ocupación máxima de <b>1.000 m²</b> en total, con hasta <b>dos viviendas y una construcción auxiliar</b>.<br></p></li></ul></li></ul><h4><b>2. Superficies y Frentes Mínimos:</b><br></h4><ul><li><p><b>Banda Intermedia:</b> Lotes mínimos de <b>2.500 m²</b> con un frente de <b>35 metros</b>.<br></p></li><li><p><b>Bandejas:</b><br></p><ul><li><p>1.200 m² para pendientes menores al 12%.<br></p></li><li><p>1.500 m² para pendientes entre el 12% y el 20%.<br></p></li><li><p><b>No se permiten lotes con pendientes mayores al 20%.</b><br></p></li></ul></li><li><p><b>Banda de la Meseta Superior:</b> Lotes mínimos de <b>10.000 m²</b> con un frente de <b>80 metros</b>.<br></p></li></ul><h4><b>3. Retiros Perimetrales:</b><br></h4><ul><li><p><b>Banda Intermedia:</b><br></p><ul><li><p>Frontal: 9 metros.<br></p></li><li><p>Bilateral y posterior: 7 metros.<br></p></li></ul></li><li><p><b>Bandejas:</b><br></p><ul><li><p>Todos los retiros de 4 metros.<br></p></li></ul></li><li><p><b>Banda de la Meseta Superior:</b><br></p><ul><li><p>Retiros de <b>15 metros</b>.<br></p></li></ul></li></ul><h3><b>Usos permitidos:</b><br></h3><ul><li><p><b>Residencial unifamiliar.</b><br></p></li><li><p><b>Hoteles y hosterías.</b><br></p></li><li><p><b>Gastronomía (confiterías, restaurantes, casas de té).</b><br></p></li><li><p><b>Servicios sanitarios, educativos, administrativos y de culto.</b><br></p></li><li><p><b>Artesanías regionales.</b><br></p></li></ul><h3><b>Usos condicionados:</b><br></h3><ul><li><p><b>Cabañas y comercios menores a 150 m²</b>, con aprobación técnica.<br></p></li><li><p><b>Equipamientos deportivos en meseta o bandejas.</b><br></p></li><li><p><b>Minimercados hasta 500 m² y estaciones de servicio solo sobre Ruta 234.</b><br></p></li><li><p><b>Actividades agropecuarias solo en la Meseta Superior.</b><br></p></li></ul><h3><b>Restricciones generales:</b><br></h3><ul><li><p><b>No se permiten subdivisiones de lotes con pendientes mayores al 20%.</b><br></p></li><li><p><b>No se admiten muros divisorios de material ni empalizadas altas.</b><br></p></li><li><p><b>Deben respetarse las condiciones de implantación y pendientes para determinar unidades habitables.</b><br></p></li><li><p><b>Movimientos de suelo y desmontes requieren aprobación previa.</b><br></p></li></ul><div><br></div>', 'POR MOMENTO NO SE VENDE Terreno La Lonja con vistas panorámicas a La Vega – 2.500-3.000 m² Ubicación: Zona elevada con vistas panorámicas a los cerros y valles de San Martín de los Andes Servicios: Luz y agua disponibles Características: Excelente orientación solar, ideal para proyectos de cabañas o vivienda permanente Valor: USD 60.000 - 75.000 Financiación: Entrega del 30-40% y saldo en 3-4 cuotas Resumen de la normativa aplicable a la construcción en la zona El Faldeo de la Vega Sur 1 (FVS1) según la ordenanza mencionada: Clasificación del suelo: Se considera suelo urbanizable , excepto la Banda de la Meseta Superior , que es suelo rural de urbanización diferida . Se permiten urbanizaciones cerradas de montaña bajo ciertas condiciones. Parámetros de construcción en nuevas divisiones y fraccionamientos Dado que los lotes indicados tienen pendientes mayores al 25% , no se admite la subdivisión de terrenos y se aplican las siguientes restricciones: 1. Altura y Ocupación: Altura máxima de edificación: 9,50 metros en la cumbrera más alta. Factor de Ocupación del Suelo (FOS): 15% en la Banda Intermedia . 20% en las Bandejas o pequeñas mesetas . En la Banda de la Meseta Superior , se permite una ocupación máxima de 1.000 m² en total, con hasta dos viviendas y una construcción auxiliar . 2. Superficies y Frentes Mínimos: Banda Intermedia: Lotes mínimos de 2.500 m² con un frente de 35 metros . Bandejas: 1.200 m² para pendientes menores al 12%. 1.500 m² para pendientes entre el 12% y el 20%. No se permiten lotes con pendientes mayores al 20%. Banda de la Meseta Superior: Lotes mínimos de 10.000 m² con un frente de 80 metros . 3. Retiros Perimetrales: Banda Intermedia: Frontal: 9 metros. Bilateral y posterior: 7 metros. Bandejas: Todos los retiros de 4 metros. Banda de la Meseta Superior: Retiros de 15 metros . Usos permitidos: Residencial unifamiliar. Hoteles y hosterías. Gastronomía (confiterías, restaurantes, casas de té). Servicios sanitarios, educativos, administrativos y de culto. Artesanías regionales. Usos condicionados: Cabañas y comercios menores a 150 m² , con aprobación técnica. Equipamientos deportivos en meseta o bandejas. Minimercados hasta 500 m² y estaciones de servicio solo sobre Ruta 234. Actividades agropecuarias solo en la Meseta Superior. Restricciones generales: No se permiten subdivisiones de lotes con pendientes mayores al 20%. No se admiten muros divisorios de material ni empalizadas altas. Deben respetarse las condiciones de implantación y pendientes para determinar unidades habitables. Movimientos de suelo y desmontes requieren aprobación previa.', false, 1)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('01C2FD09D43606DC2FF7', 'HAS ORILLAS DE CALEUFU', 'has-orillas-de-caleufu', 'San Martin de los Andes, Neuquen', 'USD 420.000', '13.000 m²', 'venta', -40.49949316293723, -71.17500304305337, '#ab47bc', 'Fracción comercial sobre el río Caleufú 📍 Club de Campo Orillas del Caleufú — Patagonia Argentina 13.000 m² con 80 metros de costa de río 💰 U$D 420.000 Hay lugares que simplemente se compran. Y hay otros que...', '<h3><br></h3><h2>Fracción comercial sobre el río Caleufú<br></h2><p>📍 Club de Campo Orillas del Caleufú — Patagonia Argentina<br></p><h3>13.000 m² con 80 metros de costa de río<br></h3><p>💰 U$D 420.000<br></p><p><br></p><div>Hay lugares que simplemente se compran.<br></div><div>Y hay otros que se proyectan como legado.<br></div><p><br></p><p>Esta fracción de 13.000 m² ubicada sobre las Orillas del río Caleufú representa una oportunidad excepcional para quienes buscan desarrollar un proyecto turístico premium, sustentable y de baja densidad, en uno de los entornos naturales más exclusivos de la Patagonia.<br></p><p>Con 80 metros de costa propia sobre el río, vistas abiertas al paisaje patagónico y conexión directa con la naturaleza, el lote ofrece un escenario ideal para desarrollar un complejo de cabañas boutique, eco-lodge, glamping de lujo o emprendimiento orientado al turismo de experiencia.<br></p><p>Ubicado dentro de Club de Campo Orillas del Caleufú, el desarrollo prioriza la preservación ambiental, la arquitectura integrada al paisaje y la convivencia armónica con el entorno natural.<br></p><h3>Un destino pensado para el turismo de naturaleza<br></h3><p>El entorno combina:<br></p><ul><li>pesca deportiva<br></li><li>kayak<br></li><li>trekking<br></li><li>cabalgatas<br></li><li>descanso premium<br></li><li>turismo aventura<br></li><li>experiencias de bienestar y desconexión<br></li></ul><p>Todo ello conectado estratégicamente con San Martín de los Andes, Villa La Angostura y Bariloche, permitiendo acceder fácilmente durante todo el año.<br></p><h3>Potencial de desarrollo turístico<br></h3><p>Dentro del reglamento del club se contemplan usos orientados al turismo y hospedaje para determinados lotes del emprendimiento, incluyendo:<br></p><ul><li>lodge<br></li><li>hostería<br></li><li>hotelería boutique<br></li><li>cabañas<br></li><li>apart hotel<br></li><li>casa de té y propuestas recreativas compatibles con el entorno natural.<br></li></ul><p>La normativa interna prioriza:<br></p><ul><li>arquitectura de montaña integrada al paisaje<br></li><li>preservación de vistas<br></li><li>utilización de materiales nobles como piedra y madera<br></li><li>proyectos de bajo impacto ambiental<br></li><li>conservación de vegetación nativa y costas naturales<br></li></ul><h3>Servicios y características<br></h3><ul><li>Alimentación eléctrica mediante generador<br></li><li>Agua por toma de río y caño troncal<br></li><li>Internet disponible dentro del desarrollo<br></li><li>Accesos consolidados<br></li><li>Entorno de privacidad y baja densidad<br></li></ul><p>Una propuesta ideal para desarrolladores, inversores o marcas de hospitalidad que entienden el valor creciente del turismo de naturaleza en Patagonia y buscan crear un proyecto auténtico, exclusivo y perdurable.<br></p><p><br></p><div><b>Denise Catalán Bienes Raíces</b><br></div><div><i>Invertí en naturaleza.</i><br></div><p><br></p><div><br></div>', 'Fracción comercial sobre el río Caleufú 📍 Club de Campo Orillas del Caleufú — Patagonia Argentina 13.000 m² con 80 metros de costa de río 💰 U$D 420.000 Hay lugares que simplemente se compran. Y hay otros que se proyectan como legado. Esta fracción de 13.000 m² ubicada sobre las Orillas del río Caleufú representa una oportunidad excepcional para quienes buscan desarrollar un proyecto turístico premium, sustentable y de baja densidad, en uno de los entornos naturales más exclusivos de la Patagonia. Con 80 metros de costa propia sobre el río, vistas abiertas al paisaje patagónico y conexión directa con la naturaleza, el lote ofrece un escenario ideal para desarrollar un complejo de cabañas boutique, eco-lodge, glamping de lujo o emprendimiento orientado al turismo de experiencia. Ubicado dentro de Club de Campo Orillas del Caleufú, el desarrollo prioriza la preservación ambiental, la arquitectura integrada al paisaje y la convivencia armónica con el entorno natural. Un destino pensado para el turismo de naturaleza El entorno combina: pesca deportiva kayak trekking cabalgatas descanso premium turismo aventura experiencias de bienestar y desconexión Todo ello conectado estratégicamente con San Martín de los Andes, Villa La Angostura y Bariloche, permitiendo acceder fácilmente durante todo el año. Potencial de desarrollo turístico Dentro del reglamento del club se contemplan usos orientados al turismo y hospedaje para determinados lotes del emprendimiento, incluyendo: lodge hostería hotelería boutique cabañas apart hotel casa de té y propuestas recreativas compatibles con el entorno natural. La normativa interna prioriza: arquitectura de montaña integrada al paisaje preservación de vistas utilización de materiales nobles como piedra y madera proyectos de bajo impacto ambiental conservación de vegetación nativa y costas naturales Servicios y características Alimentación eléctrica mediante generador Agua por toma de río y caño troncal Internet disponible dentro del desarrollo Accesos consolidados Entorno de privacidad y baja densidad Una propuesta ideal para desarrolladores, inversores o marcas de hospitalidad que entienden el valor creciente del turismo de naturaleza en Patagonia y buscan crear un proyecto auténtico, exclusivo y perdurable. Denise Catalán Bienes Raíces Invertí en naturaleza.', true, 2)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
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
    ('/images/HAS%20ORILLAS%20DE%20CALEUFU/DJI_0051.JPG', 'HAS ORILLAS DE CALEUFU', 0),
    ('/images/HAS%20ORILLAS%20DE%20CALEUFU/DJI_0054.JPG', 'HAS ORILLAS DE CALEUFU', 1),
    ('/images/HAS%20ORILLAS%20DE%20CALEUFU/DJI_0055.JPG', 'HAS ORILLAS DE CALEUFU', 2),
    ('/images/HAS%20ORILLAS%20DE%20CALEUFU/DJI_0056.JPG', 'HAS ORILLAS DE CALEUFU', 3),
    ('/images/HAS%20ORILLAS%20DE%20CALEUFU/DJI_0059.JPG', 'HAS ORILLAS DE CALEUFU', 4),
    ('/images/HAS%20ORILLAS%20DE%20CALEUFU/DJI_0061.JPG', 'HAS ORILLAS DE CALEUFU', 5),
    ('/images/HAS%20ORILLAS%20DE%20CALEUFU/DJI_0062.JPG', 'HAS ORILLAS DE CALEUFU', 6)
) as image_rows(url, alt, sort_order);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('003465DF573607164D9F', 'DEPTO ÑIRES', 'depto-nires', 'San Martin de los Andes, Neuquen', 'USD 189.000', '102 m2', 'vendido', -40.09669706609179, -71.30530764174253, '#000000', 'Valor u$d 189.000 usd 102 m2, planta alta, 3 dormitorios, 2 baños. La UF de 4 ambientes en planta alta. 100.95 m2 (con muros incluidos). Sin muros exteriores: 90,75 m2. Balcón trasero: Donde está la parrilla....', '<div>Valor u$d&nbsp; 189.000 usd<br></div><div>102 m2, planta alta, 3 dormitorios, 2 baños.<br></div><div>La UF de 4 ambientes en planta alta.&nbsp;<br></div><div><br></div><div>100.95 m2 (con muros incluidos).<br></div><div><br></div><div>Sin muros exteriores:<br></div><div>90,75 m2.<br></div><div><br></div><div>Balcón trasero:<br></div><div>Donde está la parrilla.<br></div><div>15.40 m2 .<br></div><div><br></div><div>Semi cubierta delantera 5.70 m2.<br></div><div>Es el porch de acceso del puente.<br></div><div>🏡 <b>¡Viví la naturaleza con confort en Estancia Los Ñires!</b><br></div><div>📍 <i>San Martín de los Andes – Departamento con vista abierta</i><br></div><p><br></p><p>Descubrí este hermoso departamento ubicado en un barrio residencial consolidado, rodeado de naturaleza y a minutos del centro. Ideal para quienes buscan tranquilidad, vistas abiertas y una calidad de vida única en la Patagonia.<br></p><p><br></p><div>✨ <b>Características destacadas:</b><br></div><div>🔹 102 m² en planta alta, todo en una sola planta<br></div><div>🔹 3 dormitorios amplios + 2 baños completos<br></div><div>🔹 Estacionamiento propio<br></div><div>🔹 Parrilla individual<br></div><div>🔹 Diseño funcional, detalles de calidad y excelente iluminación natural<br></div><div>🔹 Privacidad, paz y entorno natural<br></div><div>🔹 Caballerizas y restaurante dentro del barrio<br></div><div>🔹 Servicios completos: luz, agua de red y gas<br></div><div>🔹 Acceso cómodo y seguro durante todo el año<br></div><p><br></p><p><br></p><div>💰 <b>Valor: USD 189.000</b><br></div><div>📌 Se acepta entrega + financiación<br></div><div>📌 ¡Escuchamos propuestas al contado!<br></div><p><br></p><div><br></div><div>MAS DEPTOS EN POZO<br></div><div><br></div>', 'Valor u$d 189.000 usd 102 m2, planta alta, 3 dormitorios, 2 baños. La UF de 4 ambientes en planta alta. 100.95 m2 (con muros incluidos). Sin muros exteriores: 90,75 m2. Balcón trasero: Donde está la parrilla. 15.40 m2 . Semi cubierta delantera 5.70 m2. Es el porch de acceso del puente. 🏡 ¡Viví la naturaleza con confort en Estancia Los Ñires! 📍 San Martín de los Andes – Departamento con vista abierta Descubrí este hermoso departamento ubicado en un barrio residencial consolidado, rodeado de naturaleza y a minutos del centro. Ideal para quienes buscan tranquilidad, vistas abiertas y una calidad de vida única en la Patagonia. ✨ Características destacadas: 🔹 102 m² en planta alta, todo en una sola planta 🔹 3 dormitorios amplios + 2 baños completos 🔹 Estacionamiento propio 🔹 Parrilla individual 🔹 Diseño funcional, detalles de calidad y excelente iluminación natural 🔹 Privacidad, paz y entorno natural 🔹 Caballerizas y restaurante dentro del barrio 🔹 Servicios completos: luz, agua de red y gas 🔹 Acceso cómodo y seguro durante todo el año 💰 Valor: USD 189.000 📌 Se acepta entrega + financiación 📌 ¡Escuchamos propuestas al contado! MAS DEPTOS EN POZO', false, 3)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('0AD44EE27B3607244220', 'LOTE VALLESCONDIDO CC', 'lote-vallescondido-cc', 'Valle Escondido, Club de Campo Fácil', 'USD 74.000', '4.301 m²', 'vendido', -40.1622053329986, -71.30048879024898, '#000000', '. Terreno en Valle Escondido Club de Campo – 4.301 m² Ubicación: Valle Escondido, Club de Campo Fácil acceso desde el portal del barrio - uf 23 - linda con espacio verde, vegetación autóctona- Amenities: Canch...', '<p class="MsoNormal"><b><i><u>. Terreno en Valle Escondido Club de Campo – 4.301
m²</u></i></b><br></p><div><span style="line-height: 107%;"><span class="font" style="font-family: Calibri, sans-serif;"><span class="size" style="font-size: 11pt;"><span>&nbsp;</span><b>Ubicación:</b> Valle Escondido, Club de Campo</span></span></span><br></div><div><span style="line-height: 107%;"><span class="font" style="font-family: Calibri, sans-serif;"><span class="size" style="font-size: 11pt;">Fácil acceso desde el portal del barrio - uf 23 - linda con espacio verde, vegetación autóctona-<br> <span>&nbsp;</span><b>Amenities:</b> Cancha de golf de 9
hoyos, club house y resto, canchas de futbol y tenis, seguridad privada,
senderos de trekking y servicios subterráneos<br> <span>&nbsp;</span><b>Servicios:</b> Agua, luz, gas y fibra
óptica<br> <span>&nbsp;</span><b>Valor:</b> USD 74.000</span></span></span></div>', '. Terreno en Valle Escondido Club de Campo – 4.301 m² Ubicación: Valle Escondido, Club de Campo Fácil acceso desde el portal del barrio - uf 23 - linda con espacio verde, vegetación autóctona- Amenities: Cancha de golf de 9 hoyos, club house y resto, canchas de futbol y tenis, seguridad privada, senderos de trekking y servicios subterráneos Servicios: Agua, luz, gas y fibra óptica Valor: USD 74.000', false, 4)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('044DBB7B3A3608E3A6CF', 'LOTES KALEUCHE ALTO', 'lotes-kaleuche-alto', 'Kaleuche, San Martin de los Andes', 'USD 11.000', '700 m²', 'venta', -40.08920943792356, -71.32658910718146, '#ab47bc', 'Inversión Inteligente a Futuro – Lotes con Vista al Lago Lolog Manzana 139 – UF 34 a 38 Superficie por lote: 700 m² Valor desde USD 11.000 / 15.000 cash Opción de financiación y propuestas por el conjunto de 5...', '<p><br></p><div><b>Inversión Inteligente a Futuro – Lotes con Vista al Lago Lolog</b><br></div><div><b>Manzana 139 – UF 34 a 38</b><br></div><div><b>Superficie por lote: 700 m²</b><br></div><div><b>Valor desde USD 11.000 / 15.000 cash</b><br></div><div><b>Opción de financiación y propuestas por el conjunto de 5 lotes</b><br></div><p><br></p><p>Te presentamos una <b>oportunidad única para capitalizarte en tierra</b>, con cinco lotes escriturados, contiguos y con <b>impactantes vistas panorámicas al Lago Lolog</b>, en un entorno natural privilegiado.<br></p><p>Ubicados sobre la <b>Ruta Nacional 62</b>, a tan solo <b>20 minutos del centro de San Martín de los Andes</b>, en una zona con marcado crecimiento residencial y turístico.<br></p><p>Los terrenos <b>no cuentan con servicios</b>, lo que permite acceder hoy a precios muy accesibles en un área con gran proyección de desarrollo. Son ideales para quien piensa a mediano o largo plazo y busca asegurar metros cuadrados en una de las zonas más bellas y tranquilas de la Patagonia.<br></p><p><b>Características destacadas:</b><br></p><ul><li><p>Escritura inmediata en cada lote<br></p></li><li><p>Potencial de revalorización<br></p></li><li><p>Excelente acceso y conectividad<br></p></li><li><p>Inversión con bajo riesgo y alto margen de crecimiento<br></p></li><li><p>Posibilidad de adquirir hasta 3.500 m² en una sola operación<br></p></li></ul><p>Una <b>decisión estratégica</b> para quienes entienden el valor de anticiparse al mercado.<br></p><p><br></p><p><br></p><div><br></div><p><br></p><div><br></div>', 'Inversión Inteligente a Futuro – Lotes con Vista al Lago Lolog Manzana 139 – UF 34 a 38 Superficie por lote: 700 m² Valor desde USD 11.000 / 15.000 cash Opción de financiación y propuestas por el conjunto de 5 lotes Te presentamos una oportunidad única para capitalizarte en tierra , con cinco lotes escriturados, contiguos y con impactantes vistas panorámicas al Lago Lolog , en un entorno natural privilegiado. Ubicados sobre la Ruta Nacional 62 , a tan solo 20 minutos del centro de San Martín de los Andes , en una zona con marcado crecimiento residencial y turístico. Los terrenos no cuentan con servicios , lo que permite acceder hoy a precios muy accesibles en un área con gran proyección de desarrollo. Son ideales para quien piensa a mediano o largo plazo y busca asegurar metros cuadrados en una de las zonas más bellas y tranquilas de la Patagonia. Características destacadas: Escritura inmediata en cada lote Potencial de revalorización Excelente acceso y conectividad Inversión con bajo riesgo y alto margen de crecimiento Posibilidad de adquirir hasta 3.500 m² en una sola operación Una decisión estratégica para quienes entienden el valor de anticiparse al mercado.', true, 5)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('0C6D5B405D3610FB884B', 'LOTE CJN BELLO', 'lote-cjn-bello', 'San Martin de los Andes, Neuquen', 'USD 120.000', '800 m²', 'venta', -40.13506679782964, -71.30014676797302, '#ab47bc', 'Terreno en venta en Callejón de Bello 📍 San Martín de los Andes — Patagonia Argentina 800 m² | Unidad Funcional 8 💰 USD 120.000 Construir en San Martín de los Andes no es solamente elegir un terreno. Es eleg...', '<div class="qMYqUG_convSearchResultHighlightRoot"><div class="relative w-full overflow-visible"><section class="text-token-text-primary w-full focus:outline-none [--shadow-height:45px] has-data-writing-block:pointer-events-none has-data-writing-block:-mt-(--shadow-height) has-data-writing-block:pt-(--shadow-height) [&amp;:has([data-writing-block])&gt;*]:pointer-events-auto [content-visibility:auto] supports-[content-visibility:auto]:[contain-intrinsic-size:auto_100lvh] R6Vx5W_threadScrollVars scroll-mb-[calc(var(--scroll-root-safe-area-inset-bottom,0px)+var(--thread-response-height))] scroll-mt-[calc(var(--header-height)+min(200px,max(70px,20svh)))]" dir="auto"><div class="text-base my-auto mx-auto pb-10 [--thread-content-margin:var(--thread-content-margin-xs,calc(var(--spacing)*4))] @w-sm/main:[--thread-content-margin:var(--thread-content-margin-sm,calc(var(--spacing)*6))] @w-lg/main:[--thread-content-margin:var(--thread-content-margin-lg,calc(var(--spacing)*16))] px-(--thread-content-margin)"><div class="[--thread-content-max-width:40rem] @w-lg/main:[--thread-content-max-width:48rem] mx-auto max-w-(--thread-content-max-width) flex-1 group/turn-messages focus-visible:outline-hidden relative flex w-full min-w-0 flex-col agent-turn"><div class="flex max-w-full flex-col gap-4 grow"><div dir="auto" class="min-h-8 text-message relative flex w-full flex-col items-end gap-2 text-start break-words whitespace-normal outline-none keyboard-focused:focus-ring [.text-message+&amp;]:mt-1" tabindex="0"><div class="flex w-full flex-col gap-1 empty:hidden"><div class="markdown prose dark:prose-invert wrap-break-word w-full dark markdown-new-styling"><h2>Terreno en venta en Callejón de Bello<br></h2><p>📍 San Martín de los Andes — Patagonia Argentina<br></p><h3>800 m² | Unidad Funcional 8<br></h3><p>💰 USD 120.000<br></p><p><div>Construir en San Martín de los Andes no es solamente elegir un terreno.<br></div><div> Es elegir cómo querés vivir.<br></div></p><p>Ubicado sobre Callejón de Bello, una de las zonas residenciales con mayor crecimiento y valorización de la ciudad, este lote de 800 m² combina tranquilidad, entorno natural y excelente conectividad con el casco urbano.<br></p><p>La propiedad se encuentra dentro de un entorno consolidado y de baja densidad, ideal para quienes buscan desarrollar una vivienda familiar permanente, una segunda residencia en Patagonia o una inversión patrimonial con proyección a largo plazo.<br></p><h3>Características destacadas<br></h3><ul><li>Terreno plano y aprovechable<br></li><li>Excelente orientación solar<br></li><li>Acceso asfaltado durante todo el año<br></li><li>Entorno residencial consolidado<br></li><li>Fácil conexión con el centro de San Martín de los Andes<br></li></ul><h3>Servicios disponibles<br></h3><ul><li>Agua corriente<br></li><li>Electricidad<br></li><li>Gas natural<br></li><li>Fibra óptica<br></li></ul><h3>Potencial constructivo<br></h3><p>La Unidad Funcional 8 permite proyectar una vivienda cómoda, integrada al paisaje y con excelente calidad de vida, en una zona donde la demanda residencial continúa creciendo de manera sostenida.<br></p><p>FOS permitido: 76,6 m²<br></p><p>Un lugar pensado para quienes valoran la calma, la naturaleza y la posibilidad de vivir cerca de todo, sin perder privacidad ni conexión con el entorno patagónico.<br></p><p><div><b>Denise Catalán Bienes Raíces</b><br></div><div> <i>Invertí en naturaleza.</i><br></div></p></div></div></div></div><div class="z-0 flex min-h-[46px] justify-start"><br></div><div class="mt-3 w-full empty:hidden"><div class="text-center"><br></div></div></div></div></section><div class="contents"><br></div></div></div><div aria-hidden="true" class="pointer-events-none -mt-px h-px translate-y-[calc(var(--scroll-root-safe-area-inset-bottom)-14*var(--spacing))]"><br></div>', 'Terreno en venta en Callejón de Bello 📍 San Martín de los Andes — Patagonia Argentina 800 m² | Unidad Funcional 8 💰 USD 120.000 Construir en San Martín de los Andes no es solamente elegir un terreno. Es elegir cómo querés vivir. Ubicado sobre Callejón de Bello, una de las zonas residenciales con mayor crecimiento y valorización de la ciudad, este lote de 800 m² combina tranquilidad, entorno natural y excelente conectividad con el casco urbano. La propiedad se encuentra dentro de un entorno consolidado y de baja densidad, ideal para quienes buscan desarrollar una vivienda familiar permanente, una segunda residencia en Patagonia o una inversión patrimonial con proyección a largo plazo. Características destacadas Terreno plano y aprovechable Excelente orientación solar Acceso asfaltado durante todo el año Entorno residencial consolidado Fácil conexión con el centro de San Martín de los Andes Servicios disponibles Agua corriente Electricidad Gas natural Fibra óptica Potencial constructivo La Unidad Funcional 8 permite proyectar una vivienda cómoda, integrada al paisaje y con excelente calidad de vida, en una zona donde la demanda residencial continúa creciendo de manera sostenida. FOS permitido: 76,6 m² Un lugar pensado para quienes valoran la calma, la naturaleza y la posibilidad de vivir cerca de todo, sin perder privacidad ni conexión con el entorno patagónico. Denise Catalán Bienes Raíces Invertí en naturaleza.', true, 6)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('05676F7F583612FE86BD', 'HUILQUIL CASONA DE MONTAÑA', 'huilquil-casona-de-montana', 'San Martin de los Andes, Neuquen', 'Consultar', '10 hectáreas', 'alquiler_turistico', -40.1193154640638, -71.28179831304593, '#ef5350', 'CASA DE MONTAÑA | HUILQUIL – SAN MARTÍN DE LOS ANDES 8 PAX Totalmente amueblada y equipada • 4 dormitorios • 3 baños completos + toilette de recepción • Amplio living con gran chimenea a leña • Comedor princip...', '<p>CASA DE MONTAÑA | HUILQUIL – SAN MARTÍN DE LOS ANDES<br></p><div>8 PAX&nbsp;&nbsp;<br></div><div><br></div><div><span>Totalmente amueblada y equipada</span><br></div><div><span>• 4 dormitorios</span><br></div><div><span>• 3 baños completos + toilette de recepción</span><br></div><div><span>• Amplio living con gran chimenea a leña</span><br></div><div><span>• Comedor principal con salida al exterior</span><br></div><div><span>• Cocina funcional y equipada</span><br></div><div><span>• Lavadero independiente</span><br></div><div><span>• Estudio / escritorio</span><br></div><div><span>• Deck y galerías de piedra</span><br></div><div><span>• Espacios exteriores ideales para disfrutar la naturaleza</span><br></div><div><span>• Parrilla</span><br></div><div><span>• Gran garaje cubierto para dos vehículos</span><br></div><div><span>• Cuidador permanente en el predio</span><br></div><div><span>• Posibilidad de coordinar servicio de limpieza</span><br></div><div><span>• Entorno privado, silencioso y natural</span><br></div><div><span>• Ideal para residencia permanente, descanso o propuesta turística premium</span><br></div><p>Rodeada por 10 hectáreas parquizadas con árboles nativos, arbustos y flores, esta cálida casa de madera combina privacidad, naturaleza y vistas abiertas únicas hacia el valle del Maipú y la cordillera de Chapelco.<br></p><p>Construida en el año 2000 y recientemente renovada, la propiedad ofrece interiores totalmente amueblados, cómodos y pensados para disfrutar la tranquilidad de la montaña con el confort de una casa lista para habitar.<br></p><p>La planta baja cuenta con hall de ingreso, amplio living con gran chimenea a leña, comedor, toilette, cocina, lavadero, estudio y dos dormitorios con baño completo contiguo. Desde los principales ambientes se accede a una amplia galería y deck de piedra, ideales para disfrutar el entorno natural en cualquier momento del día.<br></p><p>En planta alta se encuentran dos dormitorios adicionales y un baño completo. La propiedad también dispone de un amplio garaje para dos vehículos.<br></p><p>Como valor agregado, cuenta con cuidador permanente en el predio y posibilidad de coordinar servicio de limpieza, brindando comodidad y asistencia durante toda la estadía o permanencia.<br></p><p><div>Un refugio de montaña auténtico, cálido y privado, donde la naturaleza y las vistas se convierten en parte de la experiencia cotidiana.<br></div><div>INVERTÍ EN NATURALEZA.<br></div></p><div><br></div>', 'CASA DE MONTAÑA | HUILQUIL – SAN MARTÍN DE LOS ANDES 8 PAX Totalmente amueblada y equipada • 4 dormitorios • 3 baños completos + toilette de recepción • Amplio living con gran chimenea a leña • Comedor principal con salida al exterior • Cocina funcional y equipada • Lavadero independiente • Estudio / escritorio • Deck y galerías de piedra • Espacios exteriores ideales para disfrutar la naturaleza • Parrilla • Gran garaje cubierto para dos vehículos • Cuidador permanente en el predio • Posibilidad de coordinar servicio de limpieza • Entorno privado, silencioso y natural • Ideal para residencia permanente, descanso o propuesta turística premium Rodeada por 10 hectáreas parquizadas con árboles nativos, arbustos y flores, esta cálida casa de madera combina privacidad, naturaleza y vistas abiertas únicas hacia el valle del Maipú y la cordillera de Chapelco. Construida en el año 2000 y recientemente renovada, la propiedad ofrece interiores totalmente amueblados, cómodos y pensados para disfrutar la tranquilidad de la montaña con el confort de una casa lista para habitar. La planta baja cuenta con hall de ingreso, amplio living con gran chimenea a leña, comedor, toilette, cocina, lavadero, estudio y dos dormitorios con baño completo contiguo. Desde los principales ambientes se accede a una amplia galería y deck de piedra, ideales para disfrutar el entorno natural en cualquier momento del día. En planta alta se encuentran dos dormitorios adicionales y un baño completo. La propiedad también dispone de un amplio garaje para dos vehículos. Como valor agregado, cuenta con cuidador permanente en el predio y posibilidad de coordinar servicio de limpieza, brindando comodidad y asistencia durante toda la estadía o permanencia. Un refugio de montaña auténtico, cálido y privado, donde la naturaleza y las vistas se convierten en parte de la experiencia cotidiana. INVERTÍ EN NATURALEZA.', true, 7)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
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
    ('/images/HUILQUIL%20CASONA%20DE%20MONTA%C3%91A/DJI_0396.JPG', 'HUILQUIL CASONA DE MONTAÑA', 0),
    ('/images/HUILQUIL%20CASONA%20DE%20MONTA%C3%91A/DJI_0408.JPG', 'HUILQUIL CASONA DE MONTAÑA', 1)
) as image_rows(url, alt, sort_order);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('04523FDE91363717FE6D', 'CASA LAS MARIAS DEL VALLE', 'casa-las-marias-del-valle', 'Las Marías del Valle, San Martín de los Andes', 'USD 1.220.000', '4.492 m²', 'vendido', -40.07641336598312, -71.15082686894603, '#000000', 'Casa en Las Marías del Valle – 4.492 m² Ubicación: Las Marías del Valle, San Martín de los Andes Superficie construida: 291,80 m² Superficie libre: 4.200,60 m² Costa de rio quilquihue Distribución: 4 dormitori...', '<p class="MsoNormal"><b><i><u>Casa en Las Marías del Valle – 4.492 m²</u></i></b><br></p><p class="MsoNormal"><br></p><div><span>&nbsp;</span><b>Ubicación:</b> Las
Marías del Valle, San Martín de los Andes<br></div><div><span>&nbsp;</span><b>Superficie construida:</b> 291,80 m²<br></div><div><span>&nbsp;</span><b>Superficie libre:</b> 4.200,60 m²<br></div><div>Costa de rio quilquihue<br></div><div><span>&nbsp;</span><b>Distribución:</b> 4 dormitorios, 3
baños, cocina amplia, living con hogar a leña, galería techada<br></div><div><span>&nbsp;</span><b>Características:</b> Vistas abiertas,
rodeada de bosques nativos, con excelente calidad constructiva<br></div><div><span>&nbsp;</span><b>Valor:</b> USD 1.220.000<br></div><p><br></p><div>🌲 <b>Casa con alma de río – Las Marías del Valle, San Martín de los Andes</b><br></div><div>📍 <i>Propiedad con costa sobre el río Quilquihue, a minutos del aeropuerto</i><br></div><p><br></p><p>Imaginá despertar con el sonido del agua corriendo, ver el sol filtrarse entre los árboles nativos y vivir rodeado de bosque y serenidad. Esta casa no solo está <b>inmersa en la naturaleza</b>, sino que <b>interactúa desde adentro con el fluir del río Quilquihue</b>, que bordea la propiedad con su energía viva.<br></p><p>✨ <b>Características principales:</b><br></p><ul><li><p>Terreno de <b>4.492 m²</b>, con <b>costa de río</b> y vistas completamente abiertas<br></p></li><li><p>Casa de <b>291,80 m²</b>, desarrollada con excelente calidad constructiva<br></p></li><li><p>4 dormitorios amplios<br></p></li><li><p>3 baños<br></p></li><li><p>Cocina generosa y funcional<br></p></li><li><p>Living con hogar a leña y vistas envolventes<br></p></li><li><p>Galería techada para disfrutar del entorno en cualquier estación<br></p></li></ul><p><br></p><div>🌿 <b>Entorno único:</b><br></div><div>Bosques nativos, tranquilidad absoluta y el río como protagonista. Ideal para quienes buscan privacidad, belleza natural y una conexión profunda con el paisaje patagónico.<br></div><p><br></p><p><br></p><div>🚗 <b>Ubicación estratégica:</b><br></div><div>A pocos minutos del aeropuerto de Chapelco y con excelente acceso a San Martín de los Andes.<br></div><p><br></p><p>💰 <b>Valor: USD 1.220.000</b><br></p><p>📌 Una propiedad <b>de alma patagónica</b>, pensada para quienes valoran el silencio, el diseño en armonía con el entorno y el privilegio de tener un río en casa.<br></p><p><br></p><div>📲 Consultá para recibir más info o agendar tu visita.<br></div><div><i>Denise Catalán Bienes Raíces</i> 🗝<br></div><div>Lo auténtico, al servicio de tu vida.<br></div><p><br></p><div><br></div>', 'Casa en Las Marías del Valle – 4.492 m² Ubicación: Las Marías del Valle, San Martín de los Andes Superficie construida: 291,80 m² Superficie libre: 4.200,60 m² Costa de rio quilquihue Distribución: 4 dormitorios, 3 baños, cocina amplia, living con hogar a leña, galería techada Características: Vistas abiertas, rodeada de bosques nativos, con excelente calidad constructiva Valor: USD 1.220.000 🌲 Casa con alma de río – Las Marías del Valle, San Martín de los Andes 📍 Propiedad con costa sobre el río Quilquihue, a minutos del aeropuerto Imaginá despertar con el sonido del agua corriendo, ver el sol filtrarse entre los árboles nativos y vivir rodeado de bosque y serenidad. Esta casa no solo está inmersa en la naturaleza , sino que interactúa desde adentro con el fluir del río Quilquihue , que bordea la propiedad con su energía viva. ✨ Características principales: Terreno de 4.492 m² , con costa de río y vistas completamente abiertas Casa de 291,80 m² , desarrollada con excelente calidad constructiva 4 dormitorios amplios 3 baños Cocina generosa y funcional Living con hogar a leña y vistas envolventes Galería techada para disfrutar del entorno en cualquier estación 🌿 Entorno único: Bosques nativos, tranquilidad absoluta y el río como protagonista. Ideal para quienes buscan privacidad, belleza natural y una conexión profunda con el paisaje patagónico. 🚗 Ubicación estratégica: A pocos minutos del aeropuerto de Chapelco y con excelente acceso a San Martín de los Andes. 💰 Valor: USD 1.220.000 📌 Una propiedad de alma patagónica , pensada para quienes valoran el silencio, el diseño en armonía con el entorno y el privilegio de tener un río en casa. 📲 Consultá para recibir más info o agendar tu visita. Denise Catalán Bienes Raíces 🗝 Lo auténtico, al servicio de tu vida.', false, 8)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('08CB99096437041BCD87', 'CASA MIRALEJOS', 'casa-miralejos', 'Barrio de Campo Miralejos, San Martín de los Andes', 'USD 520.000', '2.540 m²', 'vendido', -40.163016, -71.279898, '#000000', '. Casa en Barrio de Campo Miralejos – terreno de 2.540 m², casa de 260 m² cubiertos y 178 m² semicubiertos. Ubicación: Barrio de Campo Miralejos, San Martín de los Andes Superficie construida: 260 m² Superfici...', '<p class="MsoNormal"><b><i><u>. Casa en Barrio de Campo Miralejos – terreno </u></i></b><i><u>de
2.540 m², casa de 260 m² cubiertos y 178 m² semicubiertos.</u></i><br></p><p class="MsoNormal"><br></p><div><b>Ubicación:</b> Barrio de Campo Miralejos, San Martín de
los Andes<br></div><div><b>Superficie construida:</b> 260 m²<br></div><div><b>Superficie semicubierta:</b> 178 m²<br></div><div><b>Superficie del lote:</b> 2.540 m²<br></div><div><b>Distribución:</b> 4 dormitorios, 4 baños, cocina con barra, living con hogar
a leña, playroom, cava y galería techada.<br></div><div><b>Características:</b> Vistas panorámicas al Lago Lácar y valle, rodeada de
naturaleza, materiales de primera calidad (madera de lenga, pisos de incienso).<br></div><div><b>Valor:</b> USD 520.000<br></div><p><br></p><div>🏔️ <b>Viví la experiencia de la montaña en Estancia Miralejos – San Martín de los Andes</b><br></div><div>📍 <i>UF 86 – Casa con vistas panorámicas al Lago Lácar y Volcán Lanín</i><br></div><p><br></p><p><br></p><div>Para vos que buscás algo más que una casa…<br></div><div>Esta propiedad es <b>una experiencia de vida en altura</b>, a 1.100 metros sobre el nivel del mar, en un entorno natural absolutamente único. Ubicada en <b>Estancia Miralejos</b>, un exclusivo Club de Campo de 430 hectáreas en pleno cordón montañoso de Chapelco, a tan solo 30 minutos del centro de San Martín de los Andes y con acceso directo al centro de esquí por camino interno.<br></div><p><br></p><p>🌿 <b>La casa perfecta para espíritus aventureros y amantes de la montaña:</b><br></p><ul><li><p>Gran living con chimenea y vistas imponentes al lago y la cordillera<br></p></li><li><p>Cocina integrada con barra americana<br></p></li><li><p>Dormitorio principal en suite con vestidor + otra suite matrimonial en planta alta<br></p></li><li><p>Playroom con 4 camas y baño compartimentado<br></p></li><li><p>Taller/depósito con instalaciones para quincho<br></p></li><li><p>Lavadero y sala de máquinas<br></p></li><li><p>Calefacción a leña, gas y electricidad<br></p></li><li><p>Ventanas con diseño funcional para limpieza, todas en lenga con DVH<br></p></li><li><p>Hermoso deck con parrilla y fogón exterior<br></p></li><li><p>Doble garage + departamento anexo con 1 dormitorio, baño y cocina<br></p></li></ul><p>🌸 Jardines diseñados con riego por aspersión, vivero, cultivos, frutillares y frambuesas silvestres que crecen en terrazas naturales.<br></p><p>🏡 Construida por el Arq. Luzuriaga, con maderas nobles (lenga, ñire, incienso, álamo) y piedra del propio terreno. Calidad y calidez patagónica en cada rincón.<br></p><p>🌨️ Diseño pensado para el clima de montaña: protegida del viento y con techos que evacuan la nieve sin bloquear accesos.<br></p><p><br></p><div>📲 <b>Si soñás con una vida rodeado de naturaleza, paz y vistas que te dejen sin aliento, esta casa es para vos.</b><br></div><div>Consultame y coordinamos una visita.<br></div><p><br></p><p><br></p><div>📌 <i>Denise Catalán Bienes Raíces</i> 🗝<br></div><div>Autenticidad en cada propiedad que ofrecemos.<br></div><p><br></p><div><br></div>', '. Casa en Barrio de Campo Miralejos – terreno de 2.540 m², casa de 260 m² cubiertos y 178 m² semicubiertos. Ubicación: Barrio de Campo Miralejos, San Martín de los Andes Superficie construida: 260 m² Superficie semicubierta: 178 m² Superficie del lote: 2.540 m² Distribución: 4 dormitorios, 4 baños, cocina con barra, living con hogar a leña, playroom, cava y galería techada. Características: Vistas panorámicas al Lago Lácar y valle, rodeada de naturaleza, materiales de primera calidad (madera de lenga, pisos de incienso). Valor: USD 520.000 🏔️ Viví la experiencia de la montaña en Estancia Miralejos – San Martín de los Andes 📍 UF 86 – Casa con vistas panorámicas al Lago Lácar y Volcán Lanín Para vos que buscás algo más que una casa… Esta propiedad es una experiencia de vida en altura , a 1.100 metros sobre el nivel del mar, en un entorno natural absolutamente único. Ubicada en Estancia Miralejos , un exclusivo Club de Campo de 430 hectáreas en pleno cordón montañoso de Chapelco, a tan solo 30 minutos del centro de San Martín de los Andes y con acceso directo al centro de esquí por camino interno. 🌿 La casa perfecta para espíritus aventureros y amantes de la montaña: Gran living con chimenea y vistas imponentes al lago y la cordillera Cocina integrada con barra americana Dormitorio principal en suite con vestidor + otra suite matrimonial en planta alta Playroom con 4 camas y baño compartimentado Taller/depósito con instalaciones para quincho Lavadero y sala de máquinas Calefacción a leña, gas y electricidad Ventanas con diseño funcional para limpieza, todas en lenga con DVH Hermoso deck con parrilla y fogón exterior Doble garage + departamento anexo con 1 dormitorio, baño y cocina 🌸 Jardines diseñados con riego por aspersión, vivero, cultivos, frutillares y frambuesas silvestres que crecen en terrazas naturales. 🏡 Construida por el Arq. Luzuriaga, con maderas nobles (lenga, ñire, incienso, álamo) y piedra del propio terreno. Calidad y calidez patagónica en cada rincón. 🌨️ Diseño pensado para el clima de montaña: protegida del viento y con techos que evacuan la nieve sin bloquear accesos. 📲 Si soñás con una vida rodeado de naturaleza, paz y vistas que te dejen sin aliento, esta casa es para vos. Consultame y coordinamos una visita. 📌 Denise Catalán Bienes Raíces 🗝 Autenticidad en cada propiedad que ofrecemos.', false, 9)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('07363507D0370F197F50', 'TERRENO CIPRESES', 'terreno-cipreses', 'Barrio Cipreses, San Martín de los Andes Dimensiones: 25 x 45 metros', 'USD 700.000', '1.125 m²', 'vendido', -40.15075868523154, -71.3375820890827, '#000000', 'Terreno en Cipreses – 1.125 m² CON COSTA DE ARROYO TRABUNCO Ubicación: Barrio Cipreses, San Martín de los Andes Dimensiones: 25 x 45 metros Servicios: Todos los servicios disponibles (luz, agua, gas y cloacas)...', '<p class="MsoNormal"><b><i><u>Terreno en Cipreses – 1.125 m² CON COSTA DE ARROYO TRABUNCO</u></i></b><br></p><p class="MsoNormal"><br></p><div><span>&nbsp;</span><b>Ubicación:</b> Barrio Cipreses, San Martín de los Andes<br></div><div><span>&nbsp;</span><b>Dimensiones:</b> 25 x 45 metros<br></div><div><span>&nbsp;</span><b>Servicios:</b> Todos los servicios
disponibles (luz, agua, gas y cloacas)<br></div><div><span>&nbsp;</span><b>Características:</b> Ubicado en una
zona residencial de alta demanda, con entorno natural y <span>&nbsp;&nbsp;</span>tranquilidad asegurada<br></div><div><span>&nbsp;</span><b>Valor:</b> USD 700.000<br></div><p><b>Ordenanza Aplicable – Terreno de 1.125 m² en Barrio Cipreses</b><br></p><p><br></p><div><b>Ubicación:</b> Barrio Cipreses, San Martín de los Andes<br></div><div><b>Dimensiones:</b> 25 x 45 metros<br></div><p><br></p><p>El terreno se encuentra dentro del Área Residencial Los Cipreses, sector Barrio Jardín, y está sujeto a las siguientes regulaciones urbanísticas:<br></p><p><br></p><div>✅ <b>Usos permitidos:</b> Vivienda individual o colectiva, hogar infantil, residencia geriátrica, guardería, jardín de infantes, hotelería (hotel, hostería, apart hotel, cabañas).<br></div><div>✅ <b>Superficie mínima del lote:</b> 450 m²<br></div><div>✅ <b>Altura máxima de edificación:</b> 9,50 m (PB + 2 plantas)<br></div><div>✅ <b>FOS (Factor de Ocupación del Suelo):</b> 30%<br></div><div>✅ <b>Retiros:</b><br></div><p><br></p><ul><li><p>Frente: 3,00 m<br></p></li><li><p>Unilaterales: 3,00 m (para frentes mayores a 12,50 m)<br></p></li><li><p>Bilaterales: 3,00 m (para frentes mayores a 20,00 m)<br></p></li><li><p>Fondo: Máximo 10,00 m<br></p></li></ul><p>Se prohíbe la construcción en los retiros laterales.<br></p><p><br></p><div><br></div>', 'Terreno en Cipreses – 1.125 m² CON COSTA DE ARROYO TRABUNCO Ubicación: Barrio Cipreses, San Martín de los Andes Dimensiones: 25 x 45 metros Servicios: Todos los servicios disponibles (luz, agua, gas y cloacas) Características: Ubicado en una zona residencial de alta demanda, con entorno natural y tranquilidad asegurada Valor: USD 700.000 Ordenanza Aplicable – Terreno de 1.125 m² en Barrio Cipreses Ubicación: Barrio Cipreses, San Martín de los Andes Dimensiones: 25 x 45 metros El terreno se encuentra dentro del Área Residencial Los Cipreses, sector Barrio Jardín, y está sujeto a las siguientes regulaciones urbanísticas: ✅ Usos permitidos: Vivienda individual o colectiva, hogar infantil, residencia geriátrica, guardería, jardín de infantes, hotelería (hotel, hostería, apart hotel, cabañas). ✅ Superficie mínima del lote: 450 m² ✅ Altura máxima de edificación: 9,50 m (PB + 2 plantas) ✅ FOS (Factor de Ocupación del Suelo): 30% ✅ Retiros: Frente: 3,00 m Unilaterales: 3,00 m (para frentes mayores a 12,50 m) Bilaterales: 3,00 m (para frentes mayores a 20,00 m) Fondo: Máximo 10,00 m Se prohíbe la construcción en los retiros laterales.', false, 10)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('099130585137BE3FB633', 'LOTE ALIHUEN ALTO', 'lote-alihuen-alto', 'San Martin de los Andes, Neuquen', 'USD 45.000', '1.700 m²', 'venta', -40.127457, -71.318995, '#ab47bc', 'Terreno en venta en Alihuén Alto 📍 Camino al Lago Lolog — San Martín de los Andes, Patagonia Argentina 1.700 m² 💰 USD 45.000 Hay terrenos que se adaptan al paisaje. Y otros que permiten crear arquitectura co...', '<div><br></div><p><br></p><h2>Terreno en venta en Alihuén Alto<br></h2><p>📍 Camino al Lago Lolog — San Martín de los Andes, Patagonia Argentina<br></p><h3>1.700 m²<br></h3><p>💰 USD 45.000<br></p><p><br></p><div>Hay terrenos que se adaptan al paisaje.<br></div><div>Y otros que permiten crear arquitectura con identidad.<br></div><p><br></p><p>Ubicado en Alihuén Alto, a tan solo 250 metros de la Ruta Nacional 62 camino al Lago Lolog, este lote de 1.700 m² representa una excelente oportunidad para quienes buscan desarrollar un proyecto turístico, sustentable o residencial con fuerte integración al entorno natural patagónico.<br></p><p>Su pendiente pronunciada —mayor a 45°— no es una limitación: es el diferencial que permite proyectar construcciones escalonadas, maximizar vistas abiertas y generar privacidad natural entre espacios.<br></p><h3>Características destacadas<br></h3><ul><li>Superficie total: 1.700 m²<br></li><li>Terreno con pendiente pronunciada<br></li><li>Ideal para arquitectura escalonada<br></li><li>Excelente orientación y entorno natural<br></li><li>Ubicación estratégica a minutos del centro de San Martín de los Andes<br></li><li>Acceso rápido desde Ruta Nacional 62<br></li></ul><h3>Servicios disponibles<br></h3><ul><li>Agua por red<br></li><li>Electricidad<br></li><li>Gas natural<br></li></ul><h3>Potencial de desarrollo<br></h3><p>Una propuesta especialmente atractiva para:<br></p><ul><li>cabañas de montaña<br></li><li>tiny houses<br></li><li>glamping premium<br></li><li>turismo sustentable<br></li><li>vivienda de diseño integrada al paisaje<br></li></ul><p>El relieve natural del terreno permite pensar proyectos con gran impacto visual, aprovechando desniveles, visuales panorámicas y espacios exteriores con identidad patagónica auténtica.<br></p><h3>Una inversión con proyección<br></h3><p>Alihuén Alto se consolidó como una de las zonas con mayor crecimiento y demanda de San Martín de los Andes, especialmente para quienes buscan tranquilidad, naturaleza y cercanía al Lago Lolog sin alejarse de los servicios urbanos.<br></p><p>Un lote con excelente relación ubicación, superficie y valor, ideal para quienes entienden el potencial de desarrollar hoy en zonas de expansión con fuerte proyección turística y residencial.<br></p><p><br></p><div><b>Denise Catalán Bienes Raíces</b><br></div><div><i>Invertí en naturaleza.</i><br></div><p><br></p><div><br></div>', 'Terreno en venta en Alihuén Alto 📍 Camino al Lago Lolog — San Martín de los Andes, Patagonia Argentina 1.700 m² 💰 USD 45.000 Hay terrenos que se adaptan al paisaje. Y otros que permiten crear arquitectura con identidad. Ubicado en Alihuén Alto, a tan solo 250 metros de la Ruta Nacional 62 camino al Lago Lolog, este lote de 1.700 m² representa una excelente oportunidad para quienes buscan desarrollar un proyecto turístico, sustentable o residencial con fuerte integración al entorno natural patagónico. Su pendiente pronunciada —mayor a 45°— no es una limitación: es el diferencial que permite proyectar construcciones escalonadas, maximizar vistas abiertas y generar privacidad natural entre espacios. Características destacadas Superficie total: 1.700 m² Terreno con pendiente pronunciada Ideal para arquitectura escalonada Excelente orientación y entorno natural Ubicación estratégica a minutos del centro de San Martín de los Andes Acceso rápido desde Ruta Nacional 62 Servicios disponibles Agua por red Electricidad Gas natural Potencial de desarrollo Una propuesta especialmente atractiva para: cabañas de montaña tiny houses glamping premium turismo sustentable vivienda de diseño integrada al paisaje El relieve natural del terreno permite pensar proyectos con gran impacto visual, aprovechando desniveles, visuales panorámicas y espacios exteriores con identidad patagónica auténtica. Una inversión con proyección Alihuén Alto se consolidó como una de las zonas con mayor crecimiento y demanda de San Martín de los Andes, especialmente para quienes buscan tranquilidad, naturaleza y cercanía al Lago Lolog sin alejarse de los servicios urbanos. Un lote con excelente relación ubicación, superficie y valor, ideal para quienes entienden el potencial de desarrollar hoy en zonas de expansión con fuerte proyección turística y residencial. Denise Catalán Bienes Raíces Invertí en naturaleza.', true, 11)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
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
    ('/images/TERRENO%20ALIHUEN%20ALTO/aa2.jpg', 'LOTE ALIHUEN ALTO', 0),
    ('/images/TERRENO%20ALIHUEN%20ALTO/aa3.jpg', 'LOTE ALIHUEN ALTO', 1),
    ('/images/TERRENO%20ALIHUEN%20ALTO/alihuen.JPG', 'LOTE ALIHUEN ALTO', 2)
) as image_rows(url, alt, sort_order);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('0BE59C84B238918C2DA6', 'LOTE KALEUCHE MEDIO', 'lote-kaleuche-medio', 'Kaleuche, San Martin de los Andes', 'USD 45.000', '1.135 m²', 'venta', -40.10845777157749, -71.31739738194605, '#ab47bc', 'Terreno en venta en Kaleuche 📍 Calle Gerardo Masari — San Martín de los Andes, Patagonia Argentina 1.135,69 m² 💰 USD 45.000 Invertir en tierra sigue siendo una de las formas más inteligentes de construir val...', '<div><br></div><h2>Terreno en venta en Kaleuche<br></h2><p>📍 Calle Gerardo Masari — San Martín de los Andes, Patagonia Argentina<br></p><h3>1.135,69 m²<br></h3><p>💰 USD 45.000<br></p><p><br></p><div>Invertir en tierra sigue siendo una de las formas más inteligentes de construir valor.<br></div><div>Y hacerlo en una ubicación con vistas, servicios y proyección, marca la diferencia.<br></div><p><br></p><p>Este lote de 1.135,69 m² se encuentra ubicado en el fondo de un cul de sac sobre calle Gerardo Masari, dentro del barrio Kaleuche, a metros de la Ruta Nacional 62 camino al Lago Lolog.<br></p><p>Una ubicación que combina tranquilidad, privacidad y conexión rápida con el centro de San Martín de los Andes, en un entorno natural cada vez más elegido tanto para vivienda permanente como para desarrollos turísticos de escala media.<br></p><h3>Características destacadas<br></h3><ul><li>Superficie total: 1.135,69 m²<br></li><li>Fondo de cul de sac<br></li><li>Calle de baja circulación<br></li><li>Vista abierta al cordón Chapelco<br></li><li>Excelente entorno natural<br></li><li>Pendiente irregular aprovechable para proyectos escalonados<br></li></ul><h3>Servicios disponibles<br></h3><ul><li>Luz por red<br></li><li>Gas natural por red<br></li></ul><h3>Potencial de desarrollo<br></h3><p>La topografía del terreno permite proyectar una implantación arquitectónica escalonada, maximizando:<br></p><ul><li>vistas panorámicas<br></li><li>privacidad entre ambientes<br></li><li>terrazas y decks integrados al paisaje<br></li><li>construcciones por etapas<br></li></ul><p>Ideal para:<br></p><ul><li>vivienda familiar<br></li><li>cabaña de renta turística<br></li><li>tiny houses<br></li><li>inversión para construir y revender<br></li><li>desarrollo residencial de pequeña escala<br></li></ul><h3>Una oportunidad para desarrollar valor<br></h3><p>Kaleuche continúa consolidándose como una zona de crecimiento sostenido, con excelente relación entre valor de ingreso y proyección futura.<br></p><p>Este lote es especialmente atractivo para quienes buscan:<br></p><ul><li>construir en etapas<br></li><li>capitalizar una inversión accesible<br></li><li>desarrollar un producto turístico o residencial con identidad patagónica<br></li><li>combinar naturaleza, conectividad y vistas abiertas<br></li></ul><h3>Condiciones comerciales<br></h3><p><br></p><div>✔ Se acepta entrega inicial<br></div><div>✔ Posibilidad de financiación directa<br></div><p><br></p><p>Una oportunidad real para transformar tierra en proyecto, y proyecto en patrimonio.<br></p><p><br></p><div><b>Denise Catalán Bienes Raíces</b><br></div><div><i>Invertí en naturaleza.</i><br></div><p><br></p><div><br></div>', 'Terreno en venta en Kaleuche 📍 Calle Gerardo Masari — San Martín de los Andes, Patagonia Argentina 1.135,69 m² 💰 USD 45.000 Invertir en tierra sigue siendo una de las formas más inteligentes de construir valor. Y hacerlo en una ubicación con vistas, servicios y proyección, marca la diferencia. Este lote de 1.135,69 m² se encuentra ubicado en el fondo de un cul de sac sobre calle Gerardo Masari, dentro del barrio Kaleuche, a metros de la Ruta Nacional 62 camino al Lago Lolog. Una ubicación que combina tranquilidad, privacidad y conexión rápida con el centro de San Martín de los Andes, en un entorno natural cada vez más elegido tanto para vivienda permanente como para desarrollos turísticos de escala media. Características destacadas Superficie total: 1.135,69 m² Fondo de cul de sac Calle de baja circulación Vista abierta al cordón Chapelco Excelente entorno natural Pendiente irregular aprovechable para proyectos escalonados Servicios disponibles Luz por red Gas natural por red Potencial de desarrollo La topografía del terreno permite proyectar una implantación arquitectónica escalonada, maximizando: vistas panorámicas privacidad entre ambientes terrazas y decks integrados al paisaje construcciones por etapas Ideal para: vivienda familiar cabaña de renta turística tiny houses inversión para construir y revender desarrollo residencial de pequeña escala Una oportunidad para desarrollar valor Kaleuche continúa consolidándose como una zona de crecimiento sostenido, con excelente relación entre valor de ingreso y proyección futura. Este lote es especialmente atractivo para quienes buscan: construir en etapas capitalizar una inversión accesible desarrollar un producto turístico o residencial con identidad patagónica combinar naturaleza, conectividad y vistas abiertas Condiciones comerciales ✔ Se acepta entrega inicial ✔ Posibilidad de financiación directa Una oportunidad real para transformar tierra en proyecto, y proyecto en patrimonio. Denise Catalán Bienes Raíces Invertí en naturaleza.', true, 12)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('0E005E43583901A7297F', 'LOTE VEGA MAIPU', 'lote-vega-maipu', 'Vega Maipu, San Martin de los Andes', 'USD 130.000', '1.178 m²', 'venta', -40.12587734902962, -71.25133579080001, '#ab47bc', 'Lotes en venta en Vega Maipú 📍 San Martín de los Andes — Patagonia Argentina UF 8 + UF 9 589,26 m² cada uno | 1.178 m² unificados 💰 USD 130.000 cada lote 💰 USD 230.000 en conjunto Ubicación estratégica, ser...', '<h2>Lotes en venta en Vega Maipú<br></h2><p>📍 San Martín de los Andes — Patagonia Argentina<br></p><h3>UF 8 + UF 9<br></h3><h3>589,26 m² cada uno | 1.178 m² unificados<br></h3><p><br></p><div>💰 USD 130.000 cada lote<br></div><div>💰 USD 230.000 en conjunto<br></div><p><br></p><p>Ubicación estratégica, servicios completos y una zonificación que abre posibilidades de desarrollo poco frecuentes dentro de San Martín de los Andes.<br></p><p>Estos dos lotes ubicados en Vega Maipú pueden adquirirse de manera individual o unificados, conformando una superficie total de 1.178 m² en una de las zonas con mayor crecimiento residencial, comercial y operativo de la ciudad.<br></p><p>Su ubicación permite rápida conexión con Ruta Nacional 40 y acceso ágil tanto al centro como a sectores logísticos y comerciales, convirtiéndolos en una excelente alternativa para inversión, desarrollo o proyecto mixto.<br></p><h3>Características destacadas<br></h3><ul><li>UF 8: 589,26 m²<br></li><li>UF 9: 589,26 m²<br></li><li>Superficie total unificada: 1.178 m²<br></li><li>Posibilidad de compra individual o conjunta<br></li><li>Terrenos con excelente accesibilidad<br></li><li>Zona de crecimiento sostenido<br></li></ul><h3>Servicios disponibles<br></h3><ul><li>Luz por red<br></li><li>Agua corriente<br></li><li>Gas natural<br></li></ul><h3>Zonificación y potencial<br></h3><p>Ubicados dentro de Área Fabril Residencial (AFR), una zonificación pensada para usos mixtos residenciales y actividades productivas de mediana escala no contaminantes.<br></p><p>Los usos permitidos contemplan:<br></p><ul><li>vivienda unifamiliar<br></li><li>vivienda multifamiliar<br></li><li>depósitos<br></li><li>talleres<br></li><li>comercio mayorista<br></li><li>servicios y actividades complementarias compatibles con el entorno urbano.<br></li></ul><h3>Oportunidad de desarrollo<br></h3><p>Actualmente, la normativa establece una superficie mínima de parcela de 3.000 m² para determinados desarrollos dentro del área.<br></p><p>Por ello, esta propiedad presenta distintas alternativas estratégicas para inversores y desarrolladores:<br></p><ul><li>consultar factibilidad municipal para proyecto especial sobre 1.178 m²<br></li><li>evaluar englobamiento con parcelas linderas para alcanzar superficie normativa<br></li><li>desarrollar usos operativos o livianos compatibles con la zonificación vigente<br></li></ul><h3>Ideal para<br></h3><ul><li>inversores patrimoniales<br></li><li>desarrollo operativo o comercial<br></li><li>depósitos y logística liviana<br></li><li>talleres o usos productivos compatibles<br></li><li>proyectos mixtos con vivienda y actividad comercial<br></li><li>compra de tierra con proyección futura<br></li></ul><p>Una propuesta difícil de encontrar en San Martín de los Andes: ubicación estratégica, servicios completos y potencial urbano en una zona en expansión constante.<br></p><p><br></p><div><b>Denise Catalán Bienes Raíces</b><br></div><div><i>Invertí en naturaleza.</i><br></div><p><br></p><div><br></div>', 'Lotes en venta en Vega Maipú 📍 San Martín de los Andes — Patagonia Argentina UF 8 + UF 9 589,26 m² cada uno | 1.178 m² unificados 💰 USD 130.000 cada lote 💰 USD 230.000 en conjunto Ubicación estratégica, servicios completos y una zonificación que abre posibilidades de desarrollo poco frecuentes dentro de San Martín de los Andes. Estos dos lotes ubicados en Vega Maipú pueden adquirirse de manera individual o unificados, conformando una superficie total de 1.178 m² en una de las zonas con mayor crecimiento residencial, comercial y operativo de la ciudad. Su ubicación permite rápida conexión con Ruta Nacional 40 y acceso ágil tanto al centro como a sectores logísticos y comerciales, convirtiéndolos en una excelente alternativa para inversión, desarrollo o proyecto mixto. Características destacadas UF 8: 589,26 m² UF 9: 589,26 m² Superficie total unificada: 1.178 m² Posibilidad de compra individual o conjunta Terrenos con excelente accesibilidad Zona de crecimiento sostenido Servicios disponibles Luz por red Agua corriente Gas natural Zonificación y potencial Ubicados dentro de Área Fabril Residencial (AFR), una zonificación pensada para usos mixtos residenciales y actividades productivas de mediana escala no contaminantes. Los usos permitidos contemplan: vivienda unifamiliar vivienda multifamiliar depósitos talleres comercio mayorista servicios y actividades complementarias compatibles con el entorno urbano. Oportunidad de desarrollo Actualmente, la normativa establece una superficie mínima de parcela de 3.000 m² para determinados desarrollos dentro del área. Por ello, esta propiedad presenta distintas alternativas estratégicas para inversores y desarrolladores: consultar factibilidad municipal para proyecto especial sobre 1.178 m² evaluar englobamiento con parcelas linderas para alcanzar superficie normativa desarrollar usos operativos o livianos compatibles con la zonificación vigente Ideal para inversores patrimoniales desarrollo operativo o comercial depósitos y logística liviana talleres o usos productivos compatibles proyectos mixtos con vivienda y actividad comercial compra de tierra con proyección futura Una propuesta difícil de encontrar en San Martín de los Andes: ubicación estratégica, servicios completos y potencial urbano en una zona en expansión constante. Denise Catalán Bienes Raíces Invertí en naturaleza.', true, 13)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
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
    ('/images/LOTE%20VEGA%20MAIPU/CVM.jpg', 'LOTE VEGA MAIPU', 0),
    ('/images/LOTE%20VEGA%20MAIPU/vm.jpeg', 'LOTE VEGA MAIPU', 1),
    ('/images/LOTE%20VEGA%20MAIPU/vm3.jpeg', 'LOTE VEGA MAIPU', 2),
    ('/images/LOTE%20VEGA%20MAIPU/vmaipu.jpeg', 'LOTE VEGA MAIPU', 3)
) as image_rows(url, alt, sort_order);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('08EC67BAD7396ED8582C', 'LOTE ZONA CENTRO', 'lote-zona-centro', 'San Martin de los Andes, Neuquen', 'USD 250.000', '229,52 m²', 'venta', -40.15157949635648, -71.3486372763839, '#ab47bc', 'Terreno en venta con potencial de desarrollo VALOR: USD 250.000 📍 José Calderón esquina, frente al Arroyo Pocahullo — San Martín de los Andes, Patagonia Argentina En una de las ubicaciones con mayor proyecció...', '<div><br></div><h3>Terreno en venta con potencial de desarrollo<br></h3><div>VALOR: USD 250.000<br></div><p>📍 José Calderón esquina, frente al Arroyo Pocahullo — San Martín de los Andes, Patagonia Argentina<br></p><p>En una de las ubicaciones con mayor proyección urbana de San Martín de los Andes, este lote en esquina representa una oportunidad estratégica para desarrolladores, inversores o proyectos de renta turística que buscan combinar conectividad, entorno natural y potencial constructivo.<br></p><p>Ubicado frente al Arroyo Pocahullo, dentro del Área Residencial Intermedia (ARI), el terreno se encuentra a minutos del centro comercial, gastronómico y turístico de la ciudad, en un entorno consolidado y con excelente accesibilidad durante todo el año.<br></p><p>Con una superficie de 229,52 m² y un frente de 17,58 metros, permite proyectar desarrollos de vivienda colectiva, alojamiento turístico, apart hotel, unidades funcionales o espacios profesionales/comerciales, en una zona donde la demanda habitacional y turística continúa creciendo sostenidamente.<br></p><h3>Indicadores urbanísticos<br></h3><ul><li>Zonificación: Área Residencial Intermedia (ARI)<br></li><li>FOT: 1.20<br></li><li>FOS: 50 %<br></li><li>Altura máxima: PB + 2 pisos (9,5 m)<br></li><li><div>Usos permitidos:<br></div><ul><li>Vivienda individual o colectiva<br></li><li>Alojamiento turístico<br></li><li>Apart hotel / cabañas<br></li><li>Estudios profesionales<br></li><li>Local comercial compatible<br></li></ul></li></ul><p>Actualmente la propiedad cuenta con construcciones precarias a demoler, permitiendo replantear integralmente el proyecto y maximizar el aprovechamiento del lote según el perfil del inversor.<br></p><p>La parcela requiere excepción municipal por superficie mínima reglamentaria (360 m²), condición a evaluar según proyecto presentado.<br></p><p>Una propuesta ideal para quienes buscan desarrollar en una ubicación urbana con identidad patagónica, cercanía al agua y fuerte proyección de valorización.<br></p><p><br></p><div><b>Denise Catalán Bienes Raíces</b><br></div><div><i>Invertí en naturaleza.</i><br></div><p><br></p><div><br></div>', 'Terreno en venta con potencial de desarrollo VALOR: USD 250.000 📍 José Calderón esquina, frente al Arroyo Pocahullo — San Martín de los Andes, Patagonia Argentina En una de las ubicaciones con mayor proyección urbana de San Martín de los Andes, este lote en esquina representa una oportunidad estratégica para desarrolladores, inversores o proyectos de renta turística que buscan combinar conectividad, entorno natural y potencial constructivo. Ubicado frente al Arroyo Pocahullo, dentro del Área Residencial Intermedia (ARI), el terreno se encuentra a minutos del centro comercial, gastronómico y turístico de la ciudad, en un entorno consolidado y con excelente accesibilidad durante todo el año. Con una superficie de 229,52 m² y un frente de 17,58 metros, permite proyectar desarrollos de vivienda colectiva, alojamiento turístico, apart hotel, unidades funcionales o espacios profesionales/comerciales, en una zona donde la demanda habitacional y turística continúa creciendo sostenidamente. Indicadores urbanísticos Zonificación: Área Residencial Intermedia (ARI) FOT: 1.20 FOS: 50 % Altura máxima: PB + 2 pisos (9,5 m) Usos permitidos: Vivienda individual o colectiva Alojamiento turístico Apart hotel / cabañas Estudios profesionales Local comercial compatible Actualmente la propiedad cuenta con construcciones precarias a demoler, permitiendo replantear integralmente el proyecto y maximizar el aprovechamiento del lote según el perfil del inversor. La parcela requiere excepción municipal por superficie mínima reglamentaria (360 m²), condición a evaluar según proyecto presentado. Una propuesta ideal para quienes buscan desarrollar en una ubicación urbana con identidad patagónica, cercanía al agua y fuerte proyección de valorización. Denise Catalán Bienes Raíces Invertí en naturaleza.', true, 14)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('080F9D724439870E2EBB', 'LOTE 102, ESTANCIA MIRALEJOS CLUB DE CAMPO', 'lote-102-estancia-miralejos-club-de-campo', 'Estancia Miralejos, San Martin de los Andes', 'USD 165.000', '6.849 m²', 'venta', -40.17403342058235, -71.2698114460973, '#ab47bc', 'Lote premium en Estancia Miralejos 📍 UF 102 — San Martín de los Andes, Patagonia Argentina 6.849 m² 💰 U$D 165.000 🏔 A 1.400 msnm con vistas abiertas a la precordillera Hay lugares que se visitan. Y otros qu...', '<h2>Lote premium en Estancia Miralejos<br></h2><p>📍 UF 102 — San Martín de los Andes, Patagonia Argentina<br></p><h3>6.849 m²<br></h3><div>💰 U$D 165.000<br></div><p>🏔 A 1.400 msnm con vistas abiertas a la precordillera<br></p><p><br></p><div>Hay lugares que se visitan.<br></div><div>Y otros que transforman la manera de vivir.<br></div><p><br></p><p>Ubicado en uno de los puntos más altos y exclusivos de Estancia Miralejos, este lote de 6.849 m² ofrece una experiencia de montaña auténtica, rodeada de bosque nativo, silencio, aire puro y vistas imponentes hacia la precordillera patagónica.<br></p><p>Un lugar pensado para quienes sienten una conexión real con la naturaleza y buscan construir una vida integrada al paisaje, lejos del ruido y cerca de lo esencial.<br></p><h3>Características destacadas<br></h3><ul><li>Superficie total: 6.849 m²<br></li><li>Ubicación elevada dentro del desarrollo<br></li><li>Vistas abiertas y panorámicas<br></li><li>Entorno de bosque nativo<br></li><li>Privacidad y baja densidad<br></li><li>Acceso privilegiado a la montaña<br></li></ul><h3>Servicios subterráneos<br></h3><ul><li>Luz<br></li><li>Agua<br></li><li>Gas natural<br></li><li>Fibra óptica<br></li></ul><h3>Proyecto incluido<br></h3><p>La propiedad incluye un proyecto aprobado del reconocido estudio de arquitectura Velazco Suárez, diseñado especialmente para integrarse armónicamente con el entorno natural.<br></p><ul><li>Vivienda unifamiliar<br></li><li>Superficie proyectada: 203,66 m²<br></li><li>Arquitectura contemporánea de montaña<br></li><li>Implantación pensada para maximizar visuales, luz natural y privacidad<br></li></ul><h3>Estancia Miralejos<br></h3><p>Un club de campo exclusivo de 430 hectáreas, desarrollado para quienes buscan una experiencia de montaña premium, auténtica y de bajo impacto.<br></p><p>Su ubicación estratégica permite:<br></p><ul><li>acceso interno al centro de esquí Chapelco<br></li><li>conexión rápida con San Martín de los Andes<br></li><li>vivir cada estación desde una perspectiva única<br></li></ul><p>A solo 30 minutos del centro de la ciudad, Miralejos combina naturaleza extrema, infraestructura de calidad y una visión sustentable del habitar en Patagonia.<br></p><h3>Ideal para<br></h3><ul><li>amantes de la montaña<br></li><li>familias que priorizan calidad de vida<br></li><li>segunda residencia premium<br></li><li>refugio de desconexión<br></li><li>inversión patrimonial de largo plazo<br></li><li>arquitectura integrada al paisaje<br></li></ul><p>Un lugar para habitar la montaña con libertad, visión y profundidad.<br></p><p><br></p><div><b>Denise Catalán Bienes Raíces</b><br></div><div><i>Invertí en naturaleza.</i><br></div><p><br></p><div><br></div>', 'Lote premium en Estancia Miralejos 📍 UF 102 — San Martín de los Andes, Patagonia Argentina 6.849 m² 💰 U$D 165.000 🏔 A 1.400 msnm con vistas abiertas a la precordillera Hay lugares que se visitan. Y otros que transforman la manera de vivir. Ubicado en uno de los puntos más altos y exclusivos de Estancia Miralejos, este lote de 6.849 m² ofrece una experiencia de montaña auténtica, rodeada de bosque nativo, silencio, aire puro y vistas imponentes hacia la precordillera patagónica. Un lugar pensado para quienes sienten una conexión real con la naturaleza y buscan construir una vida integrada al paisaje, lejos del ruido y cerca de lo esencial. Características destacadas Superficie total: 6.849 m² Ubicación elevada dentro del desarrollo Vistas abiertas y panorámicas Entorno de bosque nativo Privacidad y baja densidad Acceso privilegiado a la montaña Servicios subterráneos Luz Agua Gas natural Fibra óptica Proyecto incluido La propiedad incluye un proyecto aprobado del reconocido estudio de arquitectura Velazco Suárez, diseñado especialmente para integrarse armónicamente con el entorno natural. Vivienda unifamiliar Superficie proyectada: 203,66 m² Arquitectura contemporánea de montaña Implantación pensada para maximizar visuales, luz natural y privacidad Estancia Miralejos Un club de campo exclusivo de 430 hectáreas, desarrollado para quienes buscan una experiencia de montaña premium, auténtica y de bajo impacto. Su ubicación estratégica permite: acceso interno al centro de esquí Chapelco conexión rápida con San Martín de los Andes vivir cada estación desde una perspectiva única A solo 30 minutos del centro de la ciudad, Miralejos combina naturaleza extrema, infraestructura de calidad y una visión sustentable del habitar en Patagonia. Ideal para amantes de la montaña familias que priorizan calidad de vida segunda residencia premium refugio de desconexión inversión patrimonial de largo plazo arquitectura integrada al paisaje Un lugar para habitar la montaña con libertad, visión y profundidad. Denise Catalán Bienes Raíces Invertí en naturaleza.', true, 15)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('0F65F3CDF33A6BBDB284', 'APART RUCALEUFÚ', 'apart-rucaleufu', 'San Martin de los Andes, Neuquen', 'USD 1.600.000', '3.669 m²', 'venta', -40.15281971798079, -71.3246963405849, '#ab47bc', 'Complejo con arroyo en venta 📍 San Martín de los Andes — Patagonia Argentina 3.669 m² de tierra con 150 metros de arroyo 💰 USD 1.600.000 Algunos activos inmobiliarios se compran por lo que son. Otros, por to...', '<div><br></div><h2>Complejo con arroyo en venta<br></h2><p>📍 San Martín de los Andes — Patagonia Argentina<br></p><h3>3.669 m² de tierra con 150 metros de arroyo<br></h3><p>💰 USD 1.600.000<br></p><p><br></p><div>Algunos activos inmobiliarios se compran por lo que son.<br></div><div>Otros, por todo lo que permiten construir hacia adelante.<br></div><p><br></p><p>Este complejo ubicado dentro de San Martín de los Andes representa una oportunidad excepcional para desarrolladores, fondos de inversión o capital privado que buscan adquirir tierra estratégica con agua, escala urbana y capacidad real de expansión en una ciudad donde este tipo de producto prácticamente ya no existe.<br></p><p>Con 3.669 m² de superficie y 150 metros lineales sobre arroyo, la propiedad combina ubicación, recurso natural y potencial constructivo en un activo difícil de replicar dentro del mercado actual.<br></p><h3>Un producto verdaderamente escaso<br></h3><p>En una ciudad donde la tierra urbana con agua natural es extremadamente limitada, este proyecto ofrece:<br></p><ul><li>arroyo propio<br></li><li>escala de desarrollo<br></li><li>ubicación consolidada<br></li><li>potencial turístico y residencial<br></li><li>posibilidad de reconversión integral<br></li></ul><p>Todo ello dentro de una de las zonas con mayor proyección de San Martín de los Andes.<br></p><h3>Situación actual<br></h3><p>Actualmente el complejo cuenta con:<br></p><ul><li>9 departamentos construidos<br></li><li>359 m² edificados<br></li><li>ocupación menor al 10% del potencial total permitido<br></li></ul><p>Esto convierte a la propiedad en un activo donde el verdadero valor está en la tierra, el entorno y la capacidad futura de desarrollo.<br></p><h3>Potencial constructivo estimado<br></h3><ul><li>Ocupación permitida en planta: ~1.100 m²<br></li><li>Volumetría total estimada: ~3.300 m²<br></li><li>Capacidad de ampliación disponible: ~2.988 m²<br></li></ul><p>Una escala poco frecuente para desarrollos urbanos dentro de San Martín de los Andes.<br></p><h3>Usos permitidos y posibilidades<br></h3><p>La propiedad permite proyectar:<br></p><ul><li>desarrollo multifamiliar premium<br></li><li>apart hotel<br></li><li>complejo turístico<br></li><li>hostería<br></li><li>cabañas boutique<br></li><li>spa &amp; wellness retreat<br></li><li>club house<br></li><li>amenities integradas al paisaje<br></li><li>reconversión residencial/turística de alta gama<br></li></ul><h3>Un activo pensado para desarrolladores con visión<br></h3><p>Este producto resulta especialmente atractivo para:<br></p><ul><li>desarrolladores turísticos<br></li><li>family offices<br></li><li>capital privado<br></li><li>inversores patrimoniales<br></li><li>operadores hoteleros boutique<br></li><li>proyectos de renta de mediano y largo plazo<br></li></ul><p>Porque reúne variables cada vez más difíciles de encontrar simultáneamente:<br></p><ul><li>tierra urbana de escala<br></li><li>agua natural<br></li><li>posibilidad de expansión<br></li><li>normativa favorable<br></li><li>entorno consolidado<br></li><li>identidad patagónica auténtica<br></li></ul><h3>Un diferencial imposible de replicar<br></h3><p>La combinación entre:<br></p><ul><li>ubicación dentro de la ciudad<br></li><li>metros de arroyo<br></li><li>baja ocupación actual<br></li><li>potencial de crecimiento<br></li><li>relación tierra/precio<br></li></ul><p>convierte a esta propiedad en uno de los activos inmobiliarios más interesantes hoy disponibles en San Martín de los Andes para desarrollo de escala media premium.<br></p><p>Un proyecto donde el valor no está solamente en lo construido, sino en todo lo que todavía puede llegar a ser.<br></p><p><br></p><div><b>Denise Catalán Bienes Raíces</b><br></div><div><i>Invertí en naturaleza.</i><br></div><p><br></p><div><br></div>', 'Complejo con arroyo en venta 📍 San Martín de los Andes — Patagonia Argentina 3.669 m² de tierra con 150 metros de arroyo 💰 USD 1.600.000 Algunos activos inmobiliarios se compran por lo que son. Otros, por todo lo que permiten construir hacia adelante. Este complejo ubicado dentro de San Martín de los Andes representa una oportunidad excepcional para desarrolladores, fondos de inversión o capital privado que buscan adquirir tierra estratégica con agua, escala urbana y capacidad real de expansión en una ciudad donde este tipo de producto prácticamente ya no existe. Con 3.669 m² de superficie y 150 metros lineales sobre arroyo, la propiedad combina ubicación, recurso natural y potencial constructivo en un activo difícil de replicar dentro del mercado actual. Un producto verdaderamente escaso En una ciudad donde la tierra urbana con agua natural es extremadamente limitada, este proyecto ofrece: arroyo propio escala de desarrollo ubicación consolidada potencial turístico y residencial posibilidad de reconversión integral Todo ello dentro de una de las zonas con mayor proyección de San Martín de los Andes. Situación actual Actualmente el complejo cuenta con: 9 departamentos construidos 359 m² edificados ocupación menor al 10% del potencial total permitido Esto convierte a la propiedad en un activo donde el verdadero valor está en la tierra, el entorno y la capacidad futura de desarrollo. Potencial constructivo estimado Ocupación permitida en planta: ~1.100 m² Volumetría total estimada: ~3.300 m² Capacidad de ampliación disponible: ~2.988 m² Una escala poco frecuente para desarrollos urbanos dentro de San Martín de los Andes. Usos permitidos y posibilidades La propiedad permite proyectar: desarrollo multifamiliar premium apart hotel complejo turístico hostería cabañas boutique spa & wellness retreat club house amenities integradas al paisaje reconversión residencial/turística de alta gama Un activo pensado para desarrolladores con visión Este producto resulta especialmente atractivo para: desarrolladores turísticos family offices capital privado inversores patrimoniales operadores hoteleros boutique proyectos de renta de mediano y largo plazo Porque reúne variables cada vez más difíciles de encontrar simultáneamente: tierra urbana de escala agua natural posibilidad de expansión normativa favorable entorno consolidado identidad patagónica auténtica Un diferencial imposible de replicar La combinación entre: ubicación dentro de la ciudad metros de arroyo baja ocupación actual potencial de crecimiento relación tierra/precio convierte a esta propiedad en uno de los activos inmobiliarios más interesantes hoy disponibles en San Martín de los Andes para desarrollo de escala media premium. Un proyecto donde el valor no está solamente en lo construido, sino en todo lo que todavía puede llegar a ser. Denise Catalán Bienes Raíces Invertí en naturaleza.', true, 16)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('039AC08FFF3B2D9D17D7', 'LOTE 42, ESTANCIA MIRALEJOS CLUB DE CAMPO', 'lote-42-estancia-miralejos-club-de-campo', 'Estancia Miralejos, San Martin de los Andes', 'USD 195.000', '2.507 m²', 'venta', -40.15871384022447, -71.28416436287861, '#ab47bc', 'Terreno premium en Estancia Miralejos Club de Campo 📍 UF 42 — San Martín de los Andes, Patagonia Argentina 2.507 m² 💰 U$D 195.000 🏔 Vistas al Lago Lácar, cancha de golf y Volcán Lanín Hay lugares que impres...', '<h2>Terreno premium en Estancia Miralejos Club de Campo<br></h2><p>📍 UF 42 — San Martín de los Andes, Patagonia Argentina<br></p><h3>2.507 m²<br></h3><div>💰 U$D 195.000<br></div><p>🏔 Vistas al Lago Lácar, cancha de golf y Volcán Lanín<br></p><p><br></p><div>Hay lugares que impresionan.<br></div><div>Y otros que generan una conexión inmediata con la montaña.<br></div><p><br></p><p>Ubicado en una de las zonas más consolidadas y exclusivas de Estancia Miralejos Club de Campo, este lote de 2.507 m² se posiciona sobre un relieve natural único, cayendo hacia un risco que potencia las visuales abiertas y genera una sensación de inmersión total en el paisaje patagónico.<br></p><p>Desde distintos puntos del terreno se despliegan vistas panorámicas hacia:<br></p><ul><li>Lago Lácar<br></li><li>Volcán Lanín<br></li><li>cancha de golf<br></li><li>cordones montañosos patagónicos<br></li></ul><p>Un escenario natural difícil de replicar dentro de San Martín de los Andes.<br></p><h3>Un terreno pensado para arquitectura de montaña<br></h3><p>La topografía natural del lote permite desarrollar una implantación arquitectónica escalonada, ideal para:<br></p><ul><li>maximizar vistas<br></li><li>generar privacidad<br></li><li>integrar decks y terrazas panorámicas<br></li><li>aprovechar luz natural durante todo el año<br></li></ul><p>Una oportunidad excepcional para diseñar una residencia contemporánea de montaña con identidad, escala y conexión real con el entorno.<br></p><h3>Servicios subterráneos<br></h3><ul><li>Agua potable<br></li><li>Luz<br></li><li>Gas natural<br></li><li>Fibra óptica<br></li></ul><p>Toda la infraestructura fue desarrollada respetando el paisaje natural y preservando la estética premium del club de campo.<br></p><h3>Estancia Miralejos<br></h3><p>Un desarrollo exclusivo de montaña pensado para quienes buscan privacidad, naturaleza y calidad de vida en Patagonia.<br></p><p>Su entorno permite vivir cada estación de manera única:<br></p><ul><li>Invierno con acceso privilegiado a Chapelco<br></li><li>Primavera rodeada de bosque nativo y flora patagónica<br></li><li>Veranos de lago, golf y montaña<br></li><li>Otoños con paisajes de colores intensos y vistas abiertas<br></li></ul><p>A solo minutos de San Martín de los Andes, Miralejos combina:<br></p><ul><li>naturaleza extrema<br></li><li>infraestructura premium<br></li><li>baja densidad<br></li><li>seguridad<br></li><li>acceso a experiencias outdoor de nivel internacional<br></li></ul><h3>Ideal para<br></h3><ul><li>residencia premium<br></li><li>segunda vivienda de montaña<br></li><li>arquitectura de autor<br></li><li>inversión patrimonial<br></li><li>amantes de la naturaleza y el golf<br></li><li>quienes buscan exclusividad sin desconectarse de la ciudad<br></li></ul><p>Un lote donde la montaña, el paisaje y la arquitectura pueden convivir de manera extraordinaria.<br></p><p><br></p><div><b>Denise Catalán Bienes Raíces</b><br></div><div><i>Invertí en naturaleza.</i><br></div><p><br></p><div><br></div>', 'Terreno premium en Estancia Miralejos Club de Campo 📍 UF 42 — San Martín de los Andes, Patagonia Argentina 2.507 m² 💰 U$D 195.000 🏔 Vistas al Lago Lácar, cancha de golf y Volcán Lanín Hay lugares que impresionan. Y otros que generan una conexión inmediata con la montaña. Ubicado en una de las zonas más consolidadas y exclusivas de Estancia Miralejos Club de Campo, este lote de 2.507 m² se posiciona sobre un relieve natural único, cayendo hacia un risco que potencia las visuales abiertas y genera una sensación de inmersión total en el paisaje patagónico. Desde distintos puntos del terreno se despliegan vistas panorámicas hacia: Lago Lácar Volcán Lanín cancha de golf cordones montañosos patagónicos Un escenario natural difícil de replicar dentro de San Martín de los Andes. Un terreno pensado para arquitectura de montaña La topografía natural del lote permite desarrollar una implantación arquitectónica escalonada, ideal para: maximizar vistas generar privacidad integrar decks y terrazas panorámicas aprovechar luz natural durante todo el año Una oportunidad excepcional para diseñar una residencia contemporánea de montaña con identidad, escala y conexión real con el entorno. Servicios subterráneos Agua potable Luz Gas natural Fibra óptica Toda la infraestructura fue desarrollada respetando el paisaje natural y preservando la estética premium del club de campo. Estancia Miralejos Un desarrollo exclusivo de montaña pensado para quienes buscan privacidad, naturaleza y calidad de vida en Patagonia. Su entorno permite vivir cada estación de manera única: Invierno con acceso privilegiado a Chapelco Primavera rodeada de bosque nativo y flora patagónica Veranos de lago, golf y montaña Otoños con paisajes de colores intensos y vistas abiertas A solo minutos de San Martín de los Andes, Miralejos combina: naturaleza extrema infraestructura premium baja densidad seguridad acceso a experiencias outdoor de nivel internacional Ideal para residencia premium segunda vivienda de montaña arquitectura de autor inversión patrimonial amantes de la naturaleza y el golf quienes buscan exclusividad sin desconectarse de la ciudad Un lote donde la montaña, el paisaje y la arquitectura pueden convivir de manera extraordinaria. Denise Catalán Bienes Raíces Invertí en naturaleza.', true, 17)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
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
    ('/images/uf%2042%20E.%20MIRALEJOS/DJI_0339.JPG', 'LOTE 42, ESTANCIA MIRALEJOS CLUB DE CAMPO', 0),
    ('/images/uf%2042%20E.%20MIRALEJOS/DJI_0356.JPG', 'LOTE 42, ESTANCIA MIRALEJOS CLUB DE CAMPO', 1),
    ('/images/uf%2042%20E.%20MIRALEJOS/DJI_0371.JPG', 'LOTE 42, ESTANCIA MIRALEJOS CLUB DE CAMPO', 2),
    ('/images/uf%2042%20E.%20MIRALEJOS/DJI_0377.JPG', 'LOTE 42, ESTANCIA MIRALEJOS CLUB DE CAMPO', 3)
) as image_rows(url, alt, sort_order);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('051F906DFE3F521C0268', 'CASA VEGA SAN MARTIN', 'casa-vega-san-martin', 'Vega Maipu, San Martin de los Andes', 'Consultar', 'Superficie a confirmar', 'venta', -40.13436393632432, -71.28797917579566, '#ab47bc', '', '', '', true, 18)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

with upserted as (
  insert into public.properties (kml_id, title, slug, location, price, area, category, latitude, longitude, marker_color, summary, description_html, raw_description, is_published, display_order)
    values ('03BFE452803F521C4137', 'CABAÑAS VEGA SAN MARTIN', 'cabanas-vega-san-martin', 'Vega Maipu, San Martin de los Andes', 'Consultar', 'Superficie a confirmar', 'venta', -40.13456806701437, -71.28786930294132, '#ab47bc', '', '', '', true, 19)
    on conflict (kml_id) do update set
      title = excluded.title,
      slug = excluded.slug,
      location = excluded.location,
      price = excluded.price,
      area = excluded.area,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      marker_color = excluded.marker_color,
      summary = excluded.summary,
      description_html = excluded.description_html,
      raw_description = excluded.raw_description,
      is_published = excluded.is_published,
      display_order = excluded.display_order,
      updated_at = now()
    returning id
)
delete from public.property_images
where property_id in (select id from upserted);

commit;
