// =====================================================================
// EcoGuard - Entrypoint Principal para Hospedagem em Nuvem (Render / Vercel)
// =====================================================================

const app = require('./src/server');

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  EcoGuard - Servidor Ativo e Escutando na porta ${PORT}`);
  console.log(`  Acesse: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
