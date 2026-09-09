# MAC/OUI registry boundary: a prefix is not a device

Accessed: 2026-09-09  
Displayed database date: 2026-09-08  
Research state: `FINITE_PUBLIC_SOURCE_SNAPSHOT`  
Claim ceiling: `REGISTRY_INTERPRETATION_NOT_DEVICE_IDENTIFICATION`

## Finding

The pasted MACLookup page is a derivative index of public identifier
assignments. It is useful for finding a possible registered assignee for a
prefix, but it is not a live map of devices, owners, operators or network
events.

The IEEE Registration Authority describes its registries as lists of unique
identifiers issued under standards. An MA-L, MA-M or MA-S row represents an
assigned identifier block. A complete EUI-48 can identify an interface when it
has been assigned and used correctly; the shorter registered prefix alone does
not identify one particular interface or physical device.

## Displayed snapshot and arithmetic

MACLookup displayed the following values on the access date:

| Registry class | Displayed records | Displayed share | Recomputed record share |
| --- | ---: | ---: | ---: |
| MA-L | 40,135 | 68.3% | 68.36% |
| MA-M | 6,581 | 11.2% | 11.21% |
| MA-S | 7,192 | 12.2% | 12.25% |
| CID | 221 | 0.3% | 0.38% |
| IAB | 4,578 | 8% | 7.80% |
| **Total** | **58,707** | **100% displayed** | **100%** |

The five counts sum exactly to the displayed total of 58,707 prefix records.
The same page displayed 33,363 vendor names. That smaller number is not a
contradiction: a registered name can occur on more than one assignment, and
the IEEE explicitly provides a process for organizations with multiple OUI
assignments and for assignment-name changes.

The percentages are therefore proportions of the **58,707 displayed registry
rows**. They are not proportions of possible MAC addresses. The displayed
values are approximate presentation values; for example, 221 / 58,707 is
about 0.38%, while the page displays 0.3%.

## Record count is not address capacity

IEEE's identifier tutorial assigns very different EUI-48 capacities to the
three active block sizes:

| Assignment | IEEE-assigned prefix length | EUI-48 capacity per assignment |
| --- | ---: | ---: |
| MA-L | 24 bits | 2^24 = 16,777,216 |
| MA-M | 28 bits | 2^20 = 1,048,576 |
| MA-S | 36 bits | 2^12 = 4,096 |
| legacy IAB | 36-bit construction | 4,096 EUI-48 identifiers |
| CID | 24-bit organization identifier | no EUI-48/EUI-64 block |

Consequently, one MA-L database row covers 4,096 times as many potential
EUI-48 values as one MA-S row. A chart that gives every registry row one vote
measures the composition of the index, not the capacity, number of manufactured
devices, number of active interfaces or network traffic.

IAB is an inactive legacy registry that IEEE says was replaced by MA-S on
2014-01-01; existing assignees may continue using their allocations until
exhaustion. CID is different again: IEEE says it cannot be used to generate
universally unique EUI-48 or EUI-64 identifiers.

## Interpretation boundaries

### Prefix != device

For MA-L, the registered 24-bit OUI is only the beginning of a possible
48-bit identifier. The assignee administers the remaining bits. MA-M and MA-S
use longer registered prefixes; IEEE also warns that their first 24 bits may
belong to an IEEE-controlled base OUI, so a 24-bit-only lookup can be
insufficient. A prefix match therefore supports a registry-assignment lookup,
not identification of a unique device.

### Vendor label != uniquely resolved real-world entity

A displayed vendor string is a label associated with an assignment record. It
does not by itself prove the current manufacturer, legal owner, operator,
physical location or user of a particular device. IEEE allows assignment
details to be updated after a company-name change or sale, allows one company
to hold multiple assignments and offers private listings in which the
assignment is public but the assignee identity is not. MACLookup also says its
derivative database combines IEEE and Wireshark information, so its labels are
not themselves an IEEE attestation about a currently observed device.

### "Latest registered" / "latest modified" != physical event

Those headings describe rows displayed as recently added or modified in the
site's database view. Nothing on the page binds them to packet capture, device
power-on, manufacture, sale, movement, connection or any other physical-network
event. At most they are metadata about a registry/index update within the
page's declared snapshot.

### `v16.25.8` has unknown semantics

`v16.25.8` is visibly printed in the site footer. No documentation reviewed
here defines whether it versions the website, API, database build or another
component. It is therefore recorded only as `VISIBLE_SITE_LABEL`; its exact
semantics remain `UNKNOWN`.

## Evidence states

| Statement | State |
| --- | --- |
| The page displayed 58,707 records, 33,363 vendor names and the five class counts above | `OBSERVED` |
| The five class counts sum to 58,707 | `ARITHMETICALLY_VERIFIED` |
| IEEE assigns MA-L, MA-M and MA-S blocks with different EUI capacities | `PRIMARY_SOURCE_SUPPORTED` |
| A prefix alone uniquely identifies a physical device, owner or location | `NOT_PROVEN` |
| A latest-row update represents a live network or hardware event | `NOT_PROVEN` |
| `v16.25.8` has a particular component meaning | `UNKNOWN` |

## Sources

- [MACLookup database page](https://maclookup.app/) — secondary/derivative
  source for the displayed snapshot, counts, headings and version label.
- [IEEE Registration Authority](https://standards.ieee.org/products-programs/regauth/)
  — primary description of the registries and public assignment listings.
- [IEEE: MAC Addresses](https://standards.ieee.org/products-programs/regauth/mac/)
  — primary overview of MA-L, MA-M and MA-S.
- [IEEE: Guidelines for Use of EUI, OUI, and CID](https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/eui.pdf)
  — primary definitions, prefix lengths, block capacities and listing caveats.
- [IEEE Registration Authority FAQs](https://standards.ieee.org/faqs/regauth/)
  — primary explanation of OUI, CID and legacy IAB.
- [IEEE Assignment Information Change Form](https://standards.ieee.org/products-programs/regauth/infocx/)
  — primary evidence that names can change and an organization can hold
  multiple assignments.

## Safety and evidence boundary

This report performed no MAC-address scan, packet capture, device probe,
geolocation or person identification. It reviewed only public documentation
and the aggregate values displayed on the supplied page. It does not determine
who owns or operates any particular device, whether any address is currently
active, or whether a specific network event occurred.
