import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding payment-bb database...');

  // Seed Payment Providers
  const stripe = await prisma.paymentProvider.upsert({
    where: { name: 'stripe' },
    update: {},
    create: {
      name: 'stripe',
      displayName: 'Stripe',
      description: 'International payment processor with card payments',
      isActive: true,
      config: JSON.stringify({
        supportedCurrencies: ['USD', 'EUR', 'XOF'],
        supportedMethods: ['card', 'bank_transfer'],
      }),
    },
  });

  const wave = await prisma.paymentProvider.upsert({
    where: { name: 'wave' },
    update: {},
    create: {
      name: 'wave',
      displayName: 'Wave',
      description: 'Mobile money for Senegal (XOF)',
      isActive: true,
      config: JSON.stringify({
        supportedCurrencies: ['XOF'],
        supportedMethods: ['mobile_money'],
      }),
    },
  });

  const orangeMoney = await prisma.paymentProvider.upsert({
    where: { name: 'orange_money' },
    update: {},
    create: {
      name: 'orange_money',
      displayName: 'Orange Money',
      description: 'Orange mobile money service',
      isActive: true,
      config: JSON.stringify({
        supportedCurrencies: ['XOF'],
        supportedMethods: ['mobile_money'],
      }),
    },
  });

  const paypal = await prisma.paymentProvider.upsert({
    where: { name: 'paypal' },
    update: {},
    create: {
      name: 'paypal',
      displayName: 'PayPal',
      description: 'PayPal payment processor',
      isActive: false,
      config: JSON.stringify({
        supportedCurrencies: ['USD', 'EUR'],
        supportedMethods: ['paypal_account', 'card'],
      }),
    },
  });

  console.log('✅ Payment providers seeded:', {
    stripe: stripe.id,
    wave: wave.id,
    orangeMoney: orangeMoney.id,
    paypal: paypal.id,
  });

  // Seed a sample invoice
  const sampleInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      userId: 'sample-user-id', // This would come from identity-bb
      status: 'PENDING',
      subtotal: 50000,
      taxAmount: 9000,
      totalAmount: 59000,
      currency: 'XOF',
      dueDate: new Date('2026-03-01'),
      notes: 'Sample invoice for driver license renewal',
      items: {
        create: [
          {
            description: 'Driver License Renewal Fee',
            quantity: 1,
            unitPrice: 50000,
            amount: 50000,
          },
        ],
      },
    },
  });

  console.log('✅ Sample invoice created:', sampleInvoice.invoiceNumber);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
