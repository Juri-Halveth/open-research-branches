# Microsoft PKI Repository: public trust records without public write authority

Accessed: 2026-09-09  
Research state: `PRIMARY_SOURCE_REVIEW`  
Claim ceiling: `STRUCTURAL_COMPARISON_NOT_CERTIFICATION`

## Finding

The Microsoft PKI Operations Repository is a public operational record for
certificate authorities run under Microsoft PKI Services. It is not a coin,
blockchain, general archive, or a list of every root trusted by Windows. Its
useful design property is narrower: identity material, policy, lifecycle
status, audits, agreements and incident reporting are published as different
objects under a controlled authority model.

The strongest transferable rule is:

> Public read access does not imply public write authority.

Microsoft's current Public TLS CPS says access to CPs, CPSs, certificates,
CRLs and certificate status is not to be limited, while controls must prevent
unauthorised additions, modifications and deletions. That creates a visible
public surface without allowing observers to rewrite the trust state.

## What the repository exposes

The live repository currently provides:

- CA certificates with displayed fingerprints and downloadable certificate files;
- certificate revocation lists (CRLs);
- test endpoints for valid, expired and revoked chains for several roots;
- current and historical Certificate Policies (CPs);
- current and historical Certification Practice Statements (CPSs), separated
  into Public TLS, third-party and corporate families;
- subscriber and relying-party agreements;
- privacy and terms material;
- WebTrust seals and independent accountant reports;
- a dedicated incident-reporting address.

The current Public TLS CPS v3.3.6 requires the repository to be available
24x7, to contain the current CP/CPS, root fingerprints, current CRLs,
qualified auditor reports, agreements and privacy/terms information, and to
offer valid, revoked and expired test certificates. It also requires annual
CP/CPS review and version increments for published updates.

## The layers stay separate

| Layer | Public object | What it establishes | What it does not establish |
| --- | --- | --- | --- |
| identity | certificate, subject/issuer, serial, fingerprint | bytes and declared certificate identity can be compared | current trust or correct use by itself |
| policy | CP | requirements and permitted assurance scope | that an operator followed the policy |
| practice | CPS | how Microsoft PKI Services declares it implements policy | independent confirmation of every operation |
| lifecycle | CRL, OCSP, valid/expired/revoked test pages | queryable status mechanisms and test cases | that every client checked fresh status |
| audit | WebTrust report and in-scope CA list | an assessor's opinion for the stated period, criteria and entities | all Microsoft PKIs, all customer controls, or future effectiveness |
| incident | reporting channel and public issue references | a route to report and preserve a response trail | resolution merely because a report exists |
| history | versioned CP/CPS archive and Git history | change provenance and comparison | that an older rule still governs a new event |

## Audit scope is explicit

The FY2026 independent accountant report covers the stated CA operations and
period from 1 May 2025 through 30 April 2026. It explicitly excludes other
Microsoft CA hierarchies not managed by Microsoft PKI Services, controls at
subscriber and relying-party locations, and several services Microsoft PKI
Services says it does not provide. It also states inherent control limitations
and limits its opinion to the described CA operations.

This is an important pattern: an audit report is useful because it names the
entities, period, criteria and exclusions. A seal is not a universal promise.
The report itself says the WebTrust seal is only a symbolic representation of
the report and adds no further assurance.

The same report preserves a concrete exception instead of erasing it: an OCSP
response-formatting and rollback matter was disclosed, scoped and associated
with a public issue. That makes the repository a status history, not a page
that only shows success.

## Relationship to the Microsoft Trusted Root Program

The PKI Operations Repository and the Microsoft Trusted Root Program are
related but different:

- the repository documents Microsoft PKI Services' own CA certificates,
  practices and audits;
- the Trusted Root Program governs requirements for CAs whose roots are
  distributed through Microsoft products.

Microsoft moved the Trusted Root Program requirements to a public GitHub
repository in October 2025. The stated reasons are transparency, version
control and automation/compliance integration. Updates are maintained through
commits and pull requests, with a changelog and separate incident, testing,
participant and application documents.

Neither repository gives arbitrary GitHub contributors authority to issue,
revoke or trust certificates. Versioned policy publication and operational
certificate authority remain separate capabilities.

## Standards context

RFC 3647 supplies the CP/CPS document framework. Its nine major components
separate publication, identification, lifecycle operations, controls,
certificate/status profiles, audits and legal matters. RFC 5280 defines the
Internet X.509 certificate and CRL profile. The CA/Browser Forum Baseline
Requirements add current requirements for publicly trusted TLS certificates
and expressly describe them as necessary but not sufficient.

This matters because the repository is not a self-invented list of links. Its
objects sit in a standards and relying-party governance chain. At the same
time, the CA/Browser Forum requirements themselves only become mandatory for
a CA when adopted and enforced by relying-party software suppliers.

## Transferable pattern for Open Research Branches

The public research repository can borrow the shape without borrowing PKI
authority:

| PKI pattern | Research-repository analogue |
| --- | --- |
| certificate fingerprint | release artifact SHA-256 digest |
| CP | publication policy and claim-ceiling rules |
| CPS | documented build, review and release procedure |
| CRL / status service | explicit `ACTIVE`, `HOLD`, `SUPERSEDED` or withdrawn state |
| valid/expired/revoked fixtures | positive, negative and obsolete test fixtures |
| audit report | versioned QA receipt with scope and exclusions |
| incident channel | security policy and issue/report route |
| controlled repository writes | reviewed merges and protected release actions |
| relying party | reader who independently decides whether the evidence fits a use |

The analogy stops before cryptographic or institutional equivalence. A Git
commit proves a byte history within that repository. It does not certify a
scientific claim, confer legal status, create a root of trust, or make a
maintainer a certification authority.

## Recommended implementation edge

For this collection, the smallest useful adoption is:

1. publish a checksum inventory for release artifacts;
2. retain versioned claim ceilings and source dates;
3. add a visible `SUPERSEDED` or withdrawal state without deleting history;
4. keep tests for accepted, rejected and obsolete records;
5. bind every review receipt to scope, version and exclusions;
6. keep public reading separate from reviewed write/merge authority.

## Sources

- [Microsoft PKI Operations Repository](https://www.microsoft.com/pkiops/Docs/Repository.htm)
- [Microsoft PKI Services Public TLS CPS v3.3.6](https://www.microsoft.com/pkiops/Docs/Content/policy/Microsoft_PKI_Services_public_tls_CPS_v3.3.6.pdf)
- [Microsoft PKI Services CP v3.2.0](https://www.microsoft.com/pkiops/Docs/Content/policy/Microsoft_PKI_Services_CP_v3.2.0.pdf)
- [FY2026 Microsoft PKI WebTrust report](https://www.microsoft.com/pkiops/docs/content/seals/Microsoft%20PKI%20WTCA%20Independent%20Accountant%27s%20Opinion%20Report%20And%20Management%20Assertion_FY26_Final.pdf)
- [Microsoft Trusted Root Program requirements](https://github.com/TrustedRootProgram/Program-Requirements)
- [Microsoft Trusted Root Program audit requirements](https://learn.microsoft.com/en-us/security/trusted-root/audit-requirements)
- [RFC 3647: CP/CPS framework](https://www.rfc-editor.org/info/rfc3647/)
- [RFC 5280: X.509 certificate and CRL profile](https://www.rfc-editor.org/info/rfc5280/)
- [CA/Browser Forum Baseline Requirements](https://cabforum.org/working-groups/server/baseline-requirements/requirements/)

## Evidence boundary

This is a current primary-source review of the public documents above. It did
not independently validate certificate chains, fetch or parse every CRL,
operate an OCSP client, verify audit workpapers, or assess private Microsoft
systems. Therefore it supports a structural comparison and a bounded public
inventory, not an independent certification or security guarantee.
