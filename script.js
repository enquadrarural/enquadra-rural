function limparValor(valor) {
  return parseFloat(
    valor
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  ) || 0;
}

function formatarMoeda(campo) {
  let valor = campo.value.replace(/\D/g, '');
  if (!valor) valor = '0';
  campo.value = (parseFloat(valor) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

document.querySelectorAll('.moeda').forEach(input => {
  input.addEventListener('input', () => formatarMoeda(input));
  input.addEventListener('blur', () => formatarMoeda(input));
  formatarMoeda(input);
});

document.getElementById('formEnquadramento').addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  const caf = form.caf.value;

  const camposAgro = [
    'graos', 'leite', 'corte', 'ovinos', 'caprinos',
    'hortas', 'frutas', 'cafe', 'bufalos', 'outrosAgro'
  ];

  const valores = {};
  camposAgro.forEach(campo => {
    valores[campo] = limparValor(form[campo].value);
  });

  const rendaExtra = [
    'assalariado', 'aposentadoria', 'prolabore', 'outrosRenda'
  ].reduce((total, campo) => total + limparValor(form[campo].value), 0);

  const rendaAgroOriginal = Object.values(valores).reduce((a, b) => a + b, 0);
  const rendaTotalOriginal = rendaAgroOriginal + rendaExtra;
  const percentualAgroOriginal = rendaTotalOriginal > 0 ? (rendaAgroOriginal / rendaTotalOriginal) * 100 : 0;

  let enquadramento = 'Demais Produtores';

  if (caf === 'SIM') {
    if (rendaAgroOriginal <= 500000 && percentualAgroOriginal >= 50) {
      enquadramento = 'PRONAF';
    } else if (percentualAgroOriginal >= 80) {
      enquadramento = 'PRONAMP';
    }
  } else {
    if (percentualAgroOriginal >= 80) {
      enquadramento = 'PRONAMP';
    }
  }

  if (enquadramento === 'PRONAF') {
    valores.leite *= 0.7;
    valores.frutas *= 0.7;
    valores.cafe *= 0.7;
  }

  const rendaAgroFinal = Object.values(valores).reduce((a, b) => a + b, 0);
  const rendaTotalFinal = rendaAgroFinal + rendaExtra;

  const formatado = valor => valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  document.getElementById('resultado').innerText =
    `Renda Agropecuária: ${formatado(rendaAgroFinal)}\n` +
    `Demais Rendas: ${formatado(rendaExtra)}\n` +
    `Renda Total: ${formatado(rendaTotalFinal)}\n` +
    `Enquadramento: ${enquadramento}`;

  // Atualiza gráfico de pizza
  const ctx = document.getElementById('graficoPizza').getContext('2d');
  if (window.graficoPizza instanceof Chart) {
    window.graficoPizza.destroy();
  }
  window.graficoPizza = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Renda Agropecuária', 'Demais Rendas'],
      datasets: [{
        data: [rendaAgroFinal, rendaExtra],
        backgroundColor: ['#2E8B57', '#FFD700'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Composição da Renda Total'
        }
      }
    }
  });
});