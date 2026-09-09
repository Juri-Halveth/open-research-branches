import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  VerificationBoundaryError,
  canonicalJson,
  classifyReferencePair,
  parseCanonicalJsonText,
  previousIssueReference,
  sha256Text,
  verifyCurrentReference,
} from "../src/reference-verifier.mjs";

const registryText = readFileSync(
  new URL("../examples/synthetic-registry.json", import.meta.url),
  "utf8",
).trim();
const expectedRegistryDigest = sha256Text(registryText);

function request(reference, principalRef = "PRINCIPAL-ALPHA") {
  return canonicalJson({
    principalRef,
    purpose: "VERIFY_OWN_CURRENT_REFERENCE",
    reference,
  });
}

function verify(
  reference,
  authenticatedPrincipalRef = "PRINCIPAL-ALPHA",
  requestPrincipalRef = "PRINCIPAL-ALPHA",
) {
  return verifyCurrentReference({
    requestText: request(reference, requestPrincipalRef),
    registryText,
    authenticatedPrincipalRef,
    expectedRegistryDigest,
  });
}

test("only the issue coordinate changes when moving to the previous synthetic reference", () => {
  assert.equal(previousIssueReference("DOC-ALPHA|2"), "DOC-ALPHA|1");
  assert.equal(previousIssueReference("DOC-ALPHA|1"), null);
  assert.throws(() => previousIssueReference("DOC-ALPHA|0"), /synthetic model grammar/);
  assert.throws(() => previousIssueReference("DOC-ALPHA|A"), /synthetic model grammar/);
});

test("a successive pair is a relation between references, not proof of identity", () => {
  assert.equal(classifyReferencePair("DOC-ALPHA|1", "DOC-ALPHA|2"), "SUCCESSIVE_ISSUES");
  assert.equal(classifyReferencePair("DOC-ALPHA|1", "DOC-BETA|2"), "RELATION_NOT_ESTABLISHED");
  assert.equal(classifyReferencePair("DOC-ALPHA|1", "DOC-ALPHA|1"), "SAME_REFERENCE");
});

test("the current reference bound to the external authenticated principal is accepted", () => {
  assert.deepEqual(verify("DOC-ALPHA|2"), {
    authorized: true,
    code: "REFERENCE_ACCEPTED",
  });
});

test("retired, unknown, wrong-principal and forged-claim failures are indistinguishable", () => {
  const retired = verify("DOC-ALPHA|1");
  const unknown = verify("DOC-ALPHA|3");
  const wrongPrincipal = verify("DOC-ALPHA|2", "PRINCIPAL-BETA", "PRINCIPAL-BETA");
  const forgedClaim = verify("DOC-ALPHA|2", "PRINCIPAL-BETA", "PRINCIPAL-ALPHA");

  assert.deepEqual(retired, { authorized: false, code: "REFERENCE_NOT_ACCEPTED" });
  assert.deepEqual(unknown, retired);
  assert.deepEqual(wrongPrincipal, retired);
  assert.deepEqual(forgedClaim, retired);
});

test("enumerating the bounded issue grammar reveals no record or lifecycle detail", () => {
  const results = [];
  for (let issue = 1; issue <= 9; issue += 1) results.push(verify(`DOC-ALPHA|${issue}`));
  assert.equal(results.filter((result) => result.authorized).length, 1);
  results.forEach((result, index) => {
    if (index === 1) return;
    assert.deepEqual(result, { authorized: false, code: "REFERENCE_NOT_ACCEPTED" });
  });
});

test("a principal written into the request never becomes authentication context", () => {
  assert.deepEqual(verify("DOC-ALPHA|2", "PRINCIPAL-BETA", "PRINCIPAL-ALPHA"), {
    authorized: false,
    code: "REFERENCE_NOT_ACCEPTED",
  });
});

test("an altered registry fails the separately supplied digest anchor", () => {
  const alteredRegistry = JSON.parse(registryText);
  alteredRegistry.records[0].state = "CURRENT";
  alteredRegistry.records[1].state = "RETIRED";

  assert.throws(
    () => verifyCurrentReference({
      requestText: request("DOC-ALPHA|1"),
      registryText: canonicalJson(alteredRegistry),
      authenticatedPrincipalRef: "PRINCIPAL-ALPHA",
      expectedRegistryDigest,
    }),
    /registry anchor mismatch/,
  );
});

test("non-canonical and over-broad inputs fail closed", () => {
  assert.throws(() => parseCanonicalJsonText('{ "a": 1 }'), VerificationBoundaryError);
  assert.throws(
    () => verifyCurrentReference({
      requestText: canonicalJson({
        extra: true,
        principalRef: "PRINCIPAL-ALPHA",
        purpose: "VERIFY_OWN_CURRENT_REFERENCE",
        reference: "DOC-ALPHA|2",
      }),
      registryText,
      authenticatedPrincipalRef: "PRINCIPAL-ALPHA",
      expectedRegistryDigest,
    }),
    /unexpected keys/,
  );
});

test("a registry cannot declare two current references for one record set", () => {
  const invalidRegistry = JSON.parse(registryText);
  invalidRegistry.records[0].state = "CURRENT";
  const invalidText = canonicalJson(invalidRegistry);

  assert.throws(
    () => verifyCurrentReference({
      requestText: request("DOC-ALPHA|2"),
      registryText: invalidText,
      authenticatedPrincipalRef: "PRINCIPAL-ALPHA",
      expectedRegistryDigest: sha256Text(invalidText),
    }),
    /multiple current references/,
  );
});

test("public results contain neither identifiers nor lifecycle labels", () => {
  for (const result of [verify("DOC-ALPHA|1"), verify("DOC-ALPHA|2")]) {
    const serialized = JSON.stringify(result);
    assert.doesNotMatch(serialized, /PRINCIPAL|SET-|DOC-|CURRENT|RETIRED/);
    assert.deepEqual(Object.keys(result).sort(), ["authorized", "code"]);
  }
});
