import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "vitest";

import {
  CLIENT_PORTAL_PROPERTY_STATUSES,
  assertClientPortalStoragePath,
  buildClientPortalPasswordResetUrl,
  clientPortalStoragePath,
  clientPortalEmailCredentials,
  fileMetadataToClientPayload,
  normalizeClientPortalProfile,
  passwordUpdateToClientPayload,
  profileToClientPayload,
  propertySubmissionToClientPayload
} from "../src/utils/supabase/clientPortal.js";
import {
  fileDataFromClientValues,
  propertySubmissionDataFromClientValues,
  portalClientSyncData
} from "../src/server/client-portal.ts";

const googleUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "CLIENTE@EXAMPLE.COM",
  user_metadata: {
    full_name: "Cliente Google",
    avatar_url: "https://example.com/avatar.jpg"
  }
};

describe("client portal helpers", () => {
  it("normalizes Google profile data for client-safe profile storage", () => {
    const payload = profileToClientPayload({ fullName: "", phone: " 2944 " }, googleUser);

    assert.deepEqual(payload, {
      userId: googleUser.id,
      email: "cliente@example.com",
      fullName: "Cliente Google",
      avatarUrl: "https://example.com/avatar.jpg",
      phone: "2944",
      isActive: true
    });

    assert.deepEqual(normalizeClientPortalProfile({ phone: "2944" }, googleUser), {
      userId: googleUser.id,
      email: "CLIENTE@EXAMPLE.COM",
      fullName: "Cliente Google",
      avatarUrl: "https://example.com/avatar.jpg",
      phone: "2944",
      isActive: true,
      createdAt: "",
      updatedAt: ""
    });
  });

  it("derives the client list payload from portal auth metadata", () => {
    assert.deepEqual(
      portalClientSyncData(
        {
          fullName: "  Ivan Muller  ",
          phone: "  +54 9 2944 123456  "
        },
        googleUser
      ),
      {
        email: "cliente@example.com",
        fullName: "Ivan Muller",
        phone: "+54 9 2944 123456"
      }
    );
  });

  it("keeps portal submission statuses constrained and never trusts body user ids", () => {
    assert.deepEqual(CLIENT_PORTAL_PROPERTY_STATUSES, [
      "borrador",
      "en_revision",
      "contactado",
      "convertido",
      "archivado"
    ]);

    const propertyPayload = propertySubmissionToClientPayload(
      {
        userId: "attacker",
        title: " Casa ",
        operation: "invalid",
        status: "convertido",
        address: " Centro "
      },
      googleUser.id
    );

    assert.equal(propertyPayload.userId, googleUser.id);
    assert.equal(propertyPayload.operation, "venta");
    assert.equal(propertyPayload.status, "en_revision");
    assert.equal(propertyPayload.address, "Centro");

    const serverPayload = propertySubmissionDataFromClientValues(
      {
        userId: "attacker",
        title: " Lote ",
        status: "borrador"
      },
      googleUser.id
    );

    assert.equal(serverPayload.userId, googleUser.id);
    assert.equal(serverPayload.status, "borrador");
  });

  it("builds and validates private Supabase Storage paths by authenticated user", () => {
    const storagePath = clientPortalStoragePath({
      userId: googleUser.id,
      entityType: "property_submission",
      entityId: "22222222-2222-4222-8222-222222222222",
      fileName: "../Plano Final.pdf"
    });

    assert.match(storagePath, new RegExp(`^${googleUser.id}/property_submission/22222222-2222-4222-8222-222222222222/`));
    assert.doesNotMatch(storagePath, /\.\.\//);
    assertClientPortalStoragePath(storagePath, googleUser.id);
    assert.throws(() => assertClientPortalStoragePath(storagePath, "33333333-3333-4333-8333-333333333333"), /no pertenece/i);

    const clientPayload = fileMetadataToClientPayload(
      {
        storagePath,
        fileName: "Plano Final.pdf",
        fileType: "application/pdf",
        fileSize: 2048,
        entityType: "property_submission",
        entityId: "22222222-2222-4222-8222-222222222222"
      },
      googleUser.id
    );

    assert.equal(clientPayload.userId, googleUser.id);
    assert.equal(clientPayload.kind, "document");

    const serverPayload = fileDataFromClientValues(clientPayload, googleUser.id);
    assert.equal(serverPayload.userId, googleUser.id);
    assert.equal(serverPayload.bucket, "client-portal-files");
    assert.equal(serverPayload.fileSize, 2048n);
  });

  it("has first-class Next routes for the client portal", () => {
    assert.equal(existsSync("src/app/clientes/[[...segments]]/page.tsx"), true);
    assert.equal(existsSync("src/components/ClientPortalAppLoader.tsx"), true);

    const robotsSource = readFileSync("src/app/robots.ts", "utf8");
    assert.match(robotsSource, /"\/clientes"/);
  });

  it("captures the upload form before async work resets it", () => {
    const source = readFileSync("src/client/ClientPortalApp.jsx", "utf8");
    const submitFileHandler = source.match(/async function submitFile\(event\) \{([\s\S]*?)\n  \}/)?.[1] || "";

    assert.match(submitFileHandler, /const\s+\w+\s*=\s*event\.currentTarget;[\s\S]*await uploadClientPortalFile/);
    assert.doesNotMatch(submitFileHandler, /event\.currentTarget\.reset\(\)/);
  });

  it("uses two visual upload target cards instead of a select", () => {
    const source = readFileSync("src/client/ClientPortalApp.jsx", "utf8");

    assert.match(source, /const uploadTargetOptions = \[/);
    assert.match(source, /value: "profile"/);
    assert.match(source, /value: "property_submission"/);
    assert.match(source, /className="client-upload-target-grid"/);
    assert.match(source, /className=\{`client-upload-target-card/);
    assert.doesNotMatch(source, /<select value=\{uploadTarget\}/);
  });

  it("normalizes email/password auth payloads and reset redirects", () => {
    const previousWindow = global.window;
    global.window = { location: { origin: "https://www.denisecatalanbienesraices.com.ar" } };

    assert.deepEqual(
      clientPortalEmailCredentials({
        email: " CLIENTE@EXAMPLE.COM ",
        password: "password-seguro",
        fullName: " Cliente Nuevo "
      }),
      {
        email: "cliente@example.com",
        password: "password-seguro",
        fullName: "Cliente Nuevo"
      }
    );
    assert.equal(buildClientPortalPasswordResetUrl(), "https://www.denisecatalanbienesraices.com.ar/clientes/restablecer");
    assert.throws(() => clientPortalEmailCredentials({ email: "cliente@example.com", password: "short" }), /8 caracteres/i);

    global.window = previousWindow;
  });

  it("validates password reset confirmation payloads", () => {
    assert.deepEqual(
      passwordUpdateToClientPayload({
        password: "password-nuevo",
        confirmPassword: "password-nuevo"
      }),
      { password: "password-nuevo" }
    );

    assert.throws(
      () => passwordUpdateToClientPayload({ password: "password-nuevo", confirmPassword: "otro-password" }),
      /coincidir/i
    );
  });
});
