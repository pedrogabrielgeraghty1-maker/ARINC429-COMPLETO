const form = document.querySelector('#envio-form');
const tableBody = document.querySelector('#envios-body');
const message = document.querySelector('#message');
const refreshButton = document.querySelector('#refresh-button');

const instrumentNames = {
  altitud: 'Altitud',
  velocidad: 'Velocidad',
  temperatura: 'Temperatura',
  presion: 'Presion'
};

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Error HTTP ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

function addCell(row, text, className = '') {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  row.append(cell);
  return cell;
}

function renderRows(envios) {
  tableBody.replaceChildren();
  if (envios.length === 0) {
    const row = document.createElement('tr');
    const cell = addCell(row, 'Todavia no hay envios registrados.', 'empty');
    cell.colSpan = 7;
    tableBody.append(row);
    return;
  }

  for (const envio of envios) {
    const row = document.createElement('tr');
    addCell(row, String(envio.id));
    addCell(row, instrumentNames[envio.instrumento] || envio.instrumento);
    addCell(row, String(envio.valor));
    addCell(row, envio.codigo_arinc, 'binary');
    addCell(row, String(envio.tension));
    addCell(row, new Date(envio.fecha_creacion).toLocaleString());

    const actions = addCell(row, '');
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'text-button';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => editEnvio(envio));
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'text-button danger';
    deleteButton.textContent = 'Borrar';
    deleteButton.addEventListener('click', () => deleteEnvio(envio.id));
    actions.append(editButton, deleteButton);
    tableBody.append(row);
  }
}

async function loadEnvios() {
  try {
    renderRows(await request('/api/envios'));
  } catch (error) {
    showMessage(`No se pudieron cargar los envios: ${error.message}`, true);
  }
}

async function editEnvio(envio) {
  const instrumento = window.prompt(
    'Instrumento (altitud, velocidad, temperatura o presion):',
    envio.instrumento
  );
  if (instrumento === null) return;
  const valorText = window.prompt('Nuevo valor numerico:', String(envio.valor));
  if (valorText === null) return;
  const valor = Number(valorText);

  try {
    await request(`/api/envios/${envio.id}`, {
      method: 'PUT',
      body: JSON.stringify({ instrumento: instrumento.trim().toLowerCase(), valor })
    });
    showMessage(`Envio #${envio.id} actualizado.`);
    await loadEnvios();
  } catch (error) {
    showMessage(`No se pudo actualizar el envio: ${error.message}`, true);
  }
}

async function deleteEnvio(id) {
  if (!window.confirm(`¿Borrar el envio #${id}?`)) return;
  try {
    await request(`/api/envios/${id}`, { method: 'DELETE' });
    showMessage(`Envio #${id} borrado.`);
    await loadEnvios();
  } catch (error) {
    showMessage(`No se pudo borrar el envio: ${error.message}`, true);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = {
    instrumento: data.get('instrumento'),
    valor: Number(data.get('valor'))
  };

  try {
    await request('/api/envios', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    showMessage('Envio generado y guardado.');
    await loadEnvios();
  } catch (error) {
    showMessage(`No se pudo guardar el envio: ${error.message}`, true);
  }
});

refreshButton.addEventListener('click', loadEnvios);
loadEnvios();
window.setInterval(loadEnvios, 3000);
