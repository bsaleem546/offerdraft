export const PACKAGES: Array<{id:string;address:string;buyer:string;amount:number;listingPrice:number;loanType:string;status:string;created:string;closing:string;earnest:number;downPct:number;contingencies:string[];story:string}> = [
  { id: "pkg-001", address: "142 Maple St, Austin TX", buyer: "James & Laura Chen", amount: 485000, listingPrice: 499000, loanType: "Conventional", status: "Complete", created: "Jun 12, 2026", closing: "Jul 28, 2026", earnest: 15000, downPct: 20, contingencies: ["Inspection", "Financing"], story: "James and Laura are a young family relocating from Chicago. They've been searching for 8 months and fell in love with this property the moment they walked in." },
  { id: "pkg-002", address: "89 Creek Ln, Denver CO", buyer: "Marcus Webb", amount: 362500, listingPrice: 375000, loanType: "FHA", status: "Draft", created: "Jun 18, 2026", closing: "Aug 02, 2026", earnest: 7500, downPct: 3.5, contingencies: ["Inspection", "Financing", "Appraisal"], story: "Marcus is a first-time homebuyer working in tech. He's pre-approved and ready to close quickly." },
  { id: "pkg-003", address: "410 Harbor Blvd, Miami FL", buyer: "Sofia Reyes", amount: 1240000, listingPrice: 1195000, loanType: "Cash", status: "Complete", created: "Jun 20, 2026", closing: "Jul 15, 2026", earnest: 50000, downPct: 100, contingencies: ["Inspection"], story: "Sofia is a cash buyer relocating from New York to be closer to family. She can close in two weeks." },
  { id: "pkg-004", address: "33 Pine Ave, Seattle WA", buyer: "David Kim", amount: 728000, listingPrice: 749000, loanType: "Conventional", status: "Draft", created: "Jun 22, 2026", closing: "Aug 10, 2026", earnest: 20000, downPct: 25, contingencies: ["Inspection", "Financing"], story: "David is a software engineer at Microsoft. He's been renting in Capitol Hill for six years and is ready to put down roots." },
  { id: "pkg-005", address: "7 Birchwood Ct, Portland OR", buyer: "The Okafor Family", amount: 519000, listingPrice: 525000, loanType: "VA", status: "Complete", created: "Jun 23, 2026", closing: "Aug 05, 2026", earnest: 10000, downPct: 0, contingencies: ["Inspection"], story: "The Okafor family is moving from a base in Texas. As VA loan buyers, they appreciate the seller's flexibility on closing costs." },
  { id: "pkg-006", address: "218 Oak Hollow Dr, Nashville TN", buyer: "Rachel & Tom Whitaker", amount: 412000, listingPrice: 419000, loanType: "Conventional", status: "Complete", created: "Jun 15, 2026", closing: "Jul 30, 2026", earnest: 12000, downPct: 20, contingencies: ["Inspection", "Financing"], story: "Rachel and Tom are expecting their second child and need more space." },
  { id: "pkg-007", address: "55 Cypress Way, San Diego CA", buyer: "Priya Sharma", amount: 875000, listingPrice: 895000, loanType: "Conventional", status: "Draft", created: "Jun 24, 2026", closing: "Aug 15, 2026", earnest: 25000, downPct: 25, contingencies: ["Inspection", "Financing", "Appraisal"], story: "Priya is a physician relocating for a new hospital role." },
  { id: "pkg-008", address: "1204 Hillcrest Rd, Boulder CO", buyer: "Jonathan & Marie Holt", amount: 1095000, listingPrice: 1125000, loanType: "Conventional", status: "Complete", created: "Jun 10, 2026", closing: "Jul 25, 2026", earnest: 35000, downPct: 30, contingencies: ["Inspection"], story: "Jonathan and Marie are downsizing from a larger home in the suburbs." },
  { id: "pkg-009", address: "76 Lakeside Pl, Minneapolis MN", buyer: "Aisha Bello", amount: 298000, listingPrice: 310000, loanType: "FHA", status: "Complete", created: "Jun 08, 2026", closing: "Jul 18, 2026", earnest: 6000, downPct: 3.5, contingencies: ["Inspection", "Financing", "Appraisal"], story: "Aisha is a teacher buying her first home with FHA financing." },
  { id: "pkg-010", address: "9 Sunset Ridge, Phoenix AZ", buyer: "Chen Family Trust", amount: 685000, listingPrice: 699000, loanType: "Cash", status: "Complete", created: "Jun 05, 2026", closing: "Jul 12, 2026", earnest: 30000, downPct: 100, contingencies: [], story: "Investment purchase by the Chen Family Trust." },
];

export const TEMPLATES = [
  { id: "tpl-1", name: "Standard Conventional", tags: "Conventional · Inspection + Financing · Professional tone", lastUsed: "3 days ago" },
  { id: "tpl-2", name: "Aggressive Cash Offer", tags: "Cash · No contingencies · Highly Competitive tone", lastUsed: "1 week ago" },
  { id: "tpl-3", name: "First-Time Buyer FHA", tags: "FHA · Full contingencies · Warm & Personal tone", lastUsed: "2 weeks ago" },
];

export const INVOICES = [
  { date: "Jun 1, 2026", desc: "Solo Plan — June 2026", amount: "$49.00", status: "Paid" },
  { date: "May 1, 2026", desc: "Solo Plan — May 2026", amount: "$49.00", status: "Paid" },
  { date: "Apr 1, 2026", desc: "Solo Plan — April 2026", amount: "$49.00", status: "Paid" },
  { date: "Mar 1, 2026", desc: "Solo Plan — March 2026", amount: "$49.00", status: "Paid" },
  { date: "Feb 1, 2026", desc: "Solo Plan — February 2026", amount: "$49.00", status: "Paid" },
  { date: "Jan 1, 2026", desc: "Solo Plan — January 2026", amount: "$49.00", status: "Paid" },
];

export const SAMPLE_COVER_LETTER = `Dear Seller,

We are writing to express our enthusiastic interest in your home at 142 Maple Street. From the moment we stepped through the front door, we knew this was the place we wanted to build our future together.

James grew up in a similar neighborhood and has always dreamed of raising our children somewhere with the same sense of community. Laura was immediately drawn to the natural light in the living room and the thoughtful renovations to the kitchen — clearly a home that has been cared for with intention.

We are offering $485,000 with a pre-approved conventional loan, a 20% down payment, and a flexible closing window to accommodate your timeline. We have included our pre-approval letter and proof of funds for your review.

We understand this is more than just a transaction — it's your home. We promise to honor the care you've put into it and continue making it a place filled with warmth and family.

Thank you for considering our offer.

Warmly,
James & Laura Chen`;

export const formatMoney = (n: number) => `$${n.toLocaleString("en-US")}`;
