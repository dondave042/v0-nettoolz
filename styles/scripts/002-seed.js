import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";

const sql = neon(process.env.DATABASE_URL);

// Simple hash for seed - app uses bcrypt-like approach via Web Crypto
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "nettoolz_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function seed() {
  console.log("Seeding database...");

  // Seed admin user
  const passwordHash = await hashPassword("Geniusva1@");
  await sql`
    INSERT INTO admin_users (email, password_hash)
    VALUES ('nettoolz@outlook.com', ${passwordHash})
    ON CONFLICT (email) DO UPDATE SET password_hash = ${passwordHash}
  `;
  console.log("Admin user seeded");

  // Seed categories
  const categories = [
    { name: "Social Media Accounts", slug: "social-media", description: "Premium social media accounts", icon: "Users", sort_order: 1 },
    { name: "Streaming Accounts", slug: "streaming", description: "Premium streaming service accounts", icon: "Play", sort_order: 2 },
    { name: "Gaming Accounts", slug: "gaming", description: "Premium gaming accounts", icon: "Gamepad2", sort_order: 3 },
    { name: "Email Accounts", slug: "email", description: "Premium email service accounts", icon: "Mail", sort_order: 4 },
    { name: "VPN & Security", slug: "vpn-security", description: "Premium VPN and security accounts", icon: "Shield", sort_order: 5 },
    { name: "Cloud Storage", slug: "cloud-storage", description: "Premium cloud storage accounts", icon: "Cloud", sort_order: 6 },
  ];

  for (const cat of categories) {
    await sql`
      INSERT INTO categories (name, slug, description, icon, sort_order)
      VALUES (${cat.name}, ${cat.slug}, ${cat.description}, ${cat.icon}, ${cat.sort_order})
      ON CONFLICT (slug) DO UPDATE SET name = ${cat.name}, description = ${cat.description}, icon = ${cat.icon}, sort_order = ${cat.sort_order}
    `;
  }
  console.log("Categories seeded");

  // Get category IDs
  const cats = await sql`SELECT id, slug FROM categories ORDER BY sort_order`;
  const catMap = {};
  for (const c of cats) catMap[c.slug] = c.id;

  // Seed products
  const products = [
    { sku: "SM-001", name: "Instagram Premium Account", description: "Aged Instagram account with 10K+ followers. Fully verified and ready for use.", price: 29.99, available_qty: 15, category_id: catMap["social-media"], badge: "HOT", is_featured: true },
    { sku: "SM-002", name: "Twitter/X Verified Account", description: "Verified Twitter/X account with established history. Blue checkmark included.", price: 49.99, available_qty: 8, category_id: catMap["social-media"], badge: "POPULAR", is_featured: true },
    { sku: "SM-003", name: "Facebook Business Account", description: "Established Facebook business account with ad history and page followers.", price: 39.99, available_qty: 12, category_id: catMap["social-media"], badge: null, is_featured: false },
    { sku: "SM-004", name: "TikTok Creator Account", description: "TikTok account with creator fund eligibility and 5K+ followers.", price: 34.99, available_qty: 10, category_id: catMap["social-media"], badge: "NEW", is_featured: true },
    { sku: "ST-001", name: "Netflix Premium Account", description: "Netflix Premium 4K UHD plan. 1-year subscription included.", price: 19.99, available_qty: 25, category_id: catMap["streaming"], badge: "BEST SELLER", is_featured: true },
    { sku: "ST-002", name: "Spotify Premium Account", description: "Spotify Premium individual plan. Ad-free music streaming.", price: 12.99, available_qty: 30, category_id: catMap["streaming"], badge: null, is_featured: false },
    { sku: "ST-003", name: "Disney+ Premium Account", description: "Disney+ Premium with no ads. Access all content.", price: 14.99, available_qty: 20, category_id: catMap["streaming"], badge: "NEW", is_featured: false },
    { sku: "GA-001", name: "Steam Account with Games", description: "Steam account with 50+ premium games. High value library.", price: 59.99, available_qty: 5, category_id: catMap["gaming"], badge: "LIMITED", is_featured: true },
    { sku: "GA-002", name: "PlayStation Plus Premium", description: "PSN account with PlayStation Plus Premium 1-year membership.", price: 44.99, available_qty: 8, category_id: catMap["gaming"], badge: null, is_featured: false },
    { sku: "EM-001", name: "Outlook Premium Account", description: "Microsoft 365 premium account with 1TB OneDrive storage.", price: 24.99, available_qty: 18, category_id: catMap["email"], badge: "POPULAR", is_featured: true },
    { sku: "VP-001", name: "NordVPN Premium Account", description: "NordVPN 2-year premium subscription. Ultimate privacy.", price: 22.99, available_qty: 15, category_id: catMap["vpn-security"], badge: null, is_featured: false },
    { sku: "CS-001", name: "Google Drive 2TB Account", description: "Google One account with 2TB storage. Full access.", price: 29.99, available_qty: 10, category_id: catMap["cloud-storage"], badge: "VALUE", is_featured: false },
  ];

  for (const p of products) {
    await sql`
      INSERT INTO products (sku, name, description, price, available_qty, category_id, badge, is_featured)
      VALUES (${p.sku}, ${p.name}, ${p.description}, ${p.price}, ${p.available_qty}, ${p.category_id}, ${p.badge}, ${p.is_featured})
      ON CONFLICT DO NOTHING
    `;
  }
  console.log("Products seeded");

  // Seed testimonials
  const testimonials = [
    { name: "Alex M.", role: "Digital Marketer", content: "NETTOOLZ is my go-to for premium accounts. Fast delivery, legit accounts, and great customer support. Highly recommend!", rating: 5 },
    { name: "Sarah K.", role: "Content Creator", content: "Bought social media accounts for my business. Everything worked perfectly. Will definitely be a returning customer.", rating: 5 },
    { name: "James R.", role: "Entrepreneur", content: "The best prices I've found for premium accounts. The process was smooth and the accounts were delivered instantly.", rating: 4 },
    { name: "Maria L.", role: "Freelancer", content: "Quick and reliable service. The streaming accounts work flawlessly. Great value for money!", rating: 5 },
  ];

  for (const t of testimonials) {
    await sql`
      INSERT INTO testimonials (name, role, content, rating)
      VALUES (${t.name}, ${t.role}, ${t.content}, ${t.rating})
      ON CONFLICT DO NOTHING
    `;
  }
  console.log("Testimonials seeded");

  // Seed announcements
  await sql`
    INSERT INTO announcements (title, content, is_active)
    VALUES
      ('Welcome to NETTOOLZ!', 'We are your ultimate destination for premium digital accounts. Browse our collection and find the best deals!', true),
      ('New Products Added!', 'Check out our latest additions including TikTok Creator accounts and Disney+ Premium subscriptions.', true)
    ON CONFLICT DO NOTHING
  `;
  console.log("Announcements seeded");

  console.log("Seeding complete!");
}

seed().catch(console.error);
