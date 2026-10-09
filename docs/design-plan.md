# لمعة — automotive detailing appointments

Arabic-first appointment website. The existing academy project is unrelated; this site lives independently under `sites/lamaa`. The name, service prices and photography are illustrative until the owner supplies business details. No invented testimonials, customer counts or physical address.

## Tokens
- Midnight paint `#082638`: primary ink, dark surfaces.
- Deep ocean `#183E54`: supporting panels.
- Champagne `#EAC18D`: primary action on the cinematic hero.
- Porcelain `#F5F7F8`: section backgrounds.
- White `#FFFFFF`: canvas and booking surfaces.
- Slate `#536472`: secondary copy.

Type: locally hosted IBM Plex Sans Arabic, 400/500/600/700. Display 72 desktop / 44 mobile; section titles 36/30; body 16; secondary 14. Natural Arabic shaping, right alignment, restrained English wordmark.

## Layout
RTL header above a wide studio photograph; oversized headline occupies the dark right-hand space and the polished car remains on the left. White quick-booking bar overlaps the hero's bottom edge. Service selection is a three-column comparison; the featured complete-care package uses a dark panel, without applying the same container treatment everywhere.

```text
| booking action        navigation              logo |
|                                                    |
|       illuminated car           Arabic headline    |
|                                 primary action     |
|           quick booking: service / vehicle / date   |
|       clear prices / scheduled care / easy changes  |
|                services heading                    |
|  ceramic protection | complete shine | essential    |
|     detailing photo | process and care explanation  |
|                questions + booking invitation      |
```

Booking: three-step native dialog, service/vehicle → available date/time → contact and review. Persist to D1, calculate prices server-side, reserve occupied hourly blocks atomically. Customer access through unguessable management tokens; no public appointment list. Cancellation frees reservations. Interface is explicit that this private demo is not connected to a real center.

## Critique before implementation
The skill search correctly recommended progressive disclosure for appointments. Its pastel SaaS surfaces and Latin futuristic fonts don't fit Arabic automotive care, so they are replaced with a studio-photography direction and Arabic typography. Avoid invented social proof and ornamental counters. The one bold moment is the full-width polished-car photograph; other sections remain quiet. Respect reduced motion, visible focus, native form labels, 44px controls and mobile reflow.
