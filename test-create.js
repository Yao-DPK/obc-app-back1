const { createTRPCProxyClient, httpBatchLink } = require('@trpc/client');
const { appRouter } = require('./media/pyke/Travail/Travail/Projects/Implementation/OBC_Website/obc-app/packages/trpc/src/server/server.ts');

const client = createTRPCProxyClient({
  links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],
});

async function test() {
  try {
    const doc = await client.document.create.mutate({
      userId: 1,
      type: 'certificat_medical',
      fileId: 'test_id',
      publicUrl: 'https://example.com',
      isObligatory: true,
    });
    console.log('Succès :', doc);
  } catch (err) {
    console.error('Erreur :', err);
  }
}
test();