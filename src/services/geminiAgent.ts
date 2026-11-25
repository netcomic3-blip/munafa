/**
 * MUNAFA 24/7 Automated Agent Service
 * Handles instant intelligent responses for customers and businesses in the Shared Inbox
 */

import { LocalEdgeDb } from './localEdgeDb';

export interface AgentResponse {
  reply: string;
  isEscalated: boolean;
  suggestedAction?: 'recovery' | 'subscription_payment' | 'order_guide' | 'contact_admin';
}

const FAQ_KNOWLEDGE: {
  keywords: string[];
  answer: string;
  suggestedAction?: 'recovery' | 'subscription_payment' | 'order_guide' | 'contact_admin';
  escalate?: boolean;
}[] = [
  {
    keywords: ['signup', 'register', 'create account', 'new account', 'how to join'],
    answer: `To sign up for Munafa:
1. Click "Register" at the top right.
2. Complete the registration form: Full Name, Address, CNIC Number, WhatsApp Number, Email, Live Photo Capture, and NTN (required for Farmer/Mining, Factory, Wholesaler; optional for Buyers).
3. Select your Account Type: Buyer (Free), Farmer/Mining (PKR 2,000/yr), Factory (PKR 2,000/mo), or Wholesaler (PKR 1,500/mo).
4. For seller accounts, complete the initial subscription transfer via JazzCash or Bank Account Transfer before starting activities.
5. Verify your OTP. Munafa generates your unique 8-digit Account Number and 4-digit PIN and delivers them to your Inbox.`,
  },
  {
    keywords: ['login', 'log in', 'sign in', 'credentials', 'password'],
    answer: `Munafa uses passwordless authentication with your 8-digit Account Number and 4-digit PIN. If you forgot your details, click "Forgot Account Number / PIN?" on the login screen to recover them using your 13-digit CNIC number.`,
  },
  {
    keywords: ['forgot', 'recover', 'lost pin', 'lost account', 'forgot account', 'cnic recovery'],
    answer: `Account Recovery is automatic:
1. Click "Forgot Account Number / PIN?" on the Login screen.
2. Enter your registered 13-digit CNIC number.
3. Your 8-digit Account Number and 4-digit PIN will be retrieved securely and sent to your Inbox.`,
    suggestedAction: 'recovery',
  },
  {
    keywords: ['subscription', 'fee', 'charges', 'annual', 'monthly', 'how much', 'cost', 'price of subscription'],
    answer: `Munafa official subscription rates:
• Buyers (Shops & Households): 100% FREE
• Farmer / Mining Business: PKR 2,000 per year (Annual)
• Factory: PKR 2,000 per month (Monthly)
• Wholesaler: PKR 1,500 per month (Monthly)

Farmers, miners, factories, and wholesalers pay via JazzCash or bank account transfer during registration before starting business activities. Automated due reminders are delivered directly to your Inbox.`,
    suggestedAction: 'subscription_payment',
  },
  {
    keywords: ['blocked', 'frozen', 'freeze', 'unblock', 'account blocked', 'late fee', 'overdue'],
    answer: `If your business subscription is overdue:
• Your product listings are temporarily paused from the public marketplace.
• You can still log in and access your Inbox to pay and message Admin.

HOW TO REACTIVATE:
1. Pay your subscription fee via JazzCash or Bank Transfer (PKR 2,000/yr Farmer/Mining, PKR 2,000/mo Factory, PKR 1,500/mo Wholesaler).
2. Submit your payment transaction reference in this Inbox to Admin.
3. Munafa Admin verifies and clicks Reactivate to restore your listings immediately.`,
    suggestedAction: 'subscription_payment',
  },
  {
    keywords: ['payment reference', 'proof of payment', 'bank slip', 'easypaisa', 'jazzcash', 'receipt'],
    answer: `To submit a subscription payment reference:
1. Open the Admin thread in your Shared Inbox or click "Send Reference to Admin" on your Seller Desk.
2. Enter your JazzCash or bank transfer reference ID and attach the receipt image.
3. Submit to Admin for immediate account reactivation.`,
    suggestedAction: 'subscription_payment',
  },
  {
    keywords: ['order', 'how to buy', 'place order', 'purchasing', 'buy goods'],
    answer: `To place an order on Munafa:
1. Search products by category (Buyers, Farmers, Factories, Wholesalers, Mining), city, or price.
2. View product photos, prices, GST taxes, and seller WhatsApp/phone contact details.
3. Use Chat, Voice Call, or Video Call via the 8-digit dialer to confirm quantities.
4. Click "Order Now" and choose Cash on Delivery (seller-arranged insured delivery) or Self Pickup (buyer responsibility).
5. Invoices and receipts are automatically delivered to both buyer and seller Inboxes.`,
    suggestedAction: 'order_guide',
  },
  {
    keywords: ['cod', 'cash on delivery', 'delivery', 'courier', 'shipping', 'transport'],
    answer: `Cash on Delivery (COD) Rules:
• Sellers (Farmers, Miners, Factories, Wholesalers) are responsible for arranging insured delivery covering missing or stolen items during transit.
• Buyers pay cash directly upon receiving the goods.
• Munafa provides connecting services only and does not transport goods or hold payments.`,
  },
  {
    keywords: ['pickup', 'collection', 'self pickup', 'safety warning'],
    answer: `Pickup Rules & Safety Notice:
• Buyers collecting items directly from the seller's farm, mine, factory, or warehouse do so at their own responsibility and transport.
• Always meet in daytime at verified business premises and verify goods before handover.`,
  },
  {
    keywords: ['tax', 'gst', 'fbr', 'sales tax', 'taxes', 'government tax', 'ntn'],
    answer: `FBR Tax & Compliance Policy:
• Munafa Platform fees are payable to Wage (registered with FBR Pakistan, NTN No: 1666865-7).
• Applicable GST, taxes, and delivery charges are adjusted by sellers and shown on receipts and PDF invoices.
• Farmers, miners, factories, and wholesalers are solely responsible for paying their applicable FBR taxes.`,
  },
  {
    keywords: ['disclaimer', 'liability', 'legal', 'stolen', 'damage', 'loss', 'who is responsible', 'munafa responsibility'],
    answer: `CORE LEGAL DISCLAIMER:
Munafa Platform fees are payable to Wage (registered with FBR Pakistan, NTN No: 1666865-7) and Munafa acts strictly as a connecting platform. Neither Wage nor Munafa is responsible for item loss, theft, missing goods, transit damage, non-payment, or unpaid taxes. Sellers handle their own delivery, insurance, and FBR tax obligations.`,
  },
  {
    keywords: ['invoice', 'statement', 'pdf', 'download invoice', 'receipt download'],
    answer: `Invoices & Statements:
• Commercial invoices and receipts showing taxes, delivery charges, and GST amounts are sent automatically to buyer and seller Inboxes.
• Download and print monthly tax statements and order invoices anytime from Orders & Invoices or Seller Desk.`,
  },
  {
    keywords: ['add item', 'upload product', 'sell', 'list item', 'how to sell'],
    answer: `To list an item for sale:
1. Log in with your Farmer/Mining, Factory, or Wholesaler account.
2. Open Seller Desk and click "Add New Item".
3. Upload product photos, description, quantity, unit, PKR price, and GST %.`,
  },
  {
    keywords: ['human', 'agent', 'admin', 'talk to person', 'representative', 'complaint', 'fraud', 'dispute', 'urgent help'],
    answer: `Your request has been escalated to Munafa Staff Admin. You may also report an order dispute directly from Orders & Invoices for Admin inspection.`,
    escalate: true,
    suggestedAction: 'contact_admin',
  },
];

export class GeminiAgentService {
  public static async answerQuery(userAccountNumber: string, userName: string, query: string): Promise<AgentResponse> {
    const cleanQuery = query.toLowerCase().trim();

    const matchedItem = FAQ_KNOWLEDGE.find((item) =>
      item.keywords.some((kw) => cleanQuery.includes(kw))
    );

    let reply = '';
    let isEscalated = false;
    const suggestedAction = matchedItem?.suggestedAction;

    if (matchedItem) {
      reply = matchedItem.answer;
      isEscalated = !!matchedItem.escalate;
    } else {
      reply = `Thank you for contacting Support. I can help you with registration, 8-digit Account & PIN recovery, subscription plans (Buyers Free, Farmer/Mining PKR 2,000/yr, Factory PKR 2,000/mo, Wholesaler PKR 1,500/mo), COD insured delivery, FBR tax invoices, and the 8-digit dialer. Munafa Platform fees are payable to Wage (registered with FBR Pakistan, NTN No: 1666865-7).`;
      isEscalated = false;
    }

    LocalEdgeDb.addAgentLog({
      userAccountNumber,
      userName,
      query,
      reply,
      isEscalated,
      adminTakenOver: false,
    });

    if (isEscalated) {
      LocalEdgeDb.sendMessage({
        threadId: `th_admin_escalations`,
        senderAccountNumber: 'system',
        senderName: 'Munafa Support Monitor',
        recipientAccountNumber: 'admin',
        type: 'system',
        content: `ESCALATION ALERT: Account #${userAccountNumber} (${userName}) requested human support. Query: "${query.slice(0, 120)}"`,
      });
    }

    return {
      reply,
      isEscalated,
      suggestedAction,
    };
  }

  public static async generateAgentReply(query: string, user?: { accountNumber: string; name: string }): Promise<string> {
    const res = await GeminiAgentService.answerQuery(user?.accountNumber || 'guest', user?.name || 'Guest User', query);
    return res.reply;
  }
}
