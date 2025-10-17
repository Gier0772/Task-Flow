const usuarios = [
  { usuario: "admin", pass: "admin123" },
  { usuario: "empleado", pass: "tareas123" }
];
let usuarioActivo = null;
const loginForm = document.getElementById('loginForm');
const loginOverlay = document.getElementById('login-overlay');
const dashboard = document.getElementById('dashboard');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const miUsuarioSpan = document.getElementById('miUsuario');

// Función para actualizar información del usuario en Mi Cuenta
function actualizarInfoUsuario() {
  if (usuarioActivo) {
    document.getElementById('miUsuario').textContent = usuarioActivo;
    document.getElementById('miUsuarioNombre').textContent = usuarioActivo;
    
    // Avatar con iniciales
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
      avatar.textContent = usuarioActivo.charAt(0).toUpperCase();
    }
    
    // Determinar rol
    const rol = document.getElementById('miRol');
    if (rol) {
      rol.textContent = usuarioActivo === 'admin' ? 'Administrador' : 'Empleado';
    }
    
    // Actualizar último acceso
    const ultimoAcceso = document.getElementById('ultimoAcceso');
    if (ultimoAcceso) {
      const ahora = new Date();
      ultimoAcceso.textContent = ahora.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}

// Función auxiliar para mostrar mensajes de cambio de contraseña
function mostrarMensajeClave(mensaje, tipo) {
  const msgElement = document.getElementById('cambioClaveMsg');
  msgElement.textContent = mensaje;
  msgElement.className = tipo;
  msgElement.style.display = "block";
}

// Login
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const u = usuarios.find(u => u.usuario === user && u.pass === pass);
    if (u) {
      usuarioActivo = u.usuario;
      actualizarInfoUsuario();
      document.body.classList.add('dashboard-visible');
      loginError.textContent = "";
    } else {
      loginError.textContent = "Usuario o contraseña incorrectos";
    }
    loginForm.reset();
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', function() {
    document.body.classList.remove('dashboard-visible');
    usuarioActivo = null;
  });
}

// Navegación entre secciones
document.querySelectorAll('.menu-item').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.dashboard-panel').forEach(sec => sec.style.display = "none");
    const sec = document.getElementById(this.dataset.section);
    if (sec) sec.style.display = "block";
    if(this.dataset.section === "tareas-section") actualizarListado();
    if(this.dataset.section === "reportes-section") refreshReportes();
    if(this.dataset.section === "empleados-section") refreshEmpleados();
    if(this.dataset.section === "micuenta-section") {
      actualizarInfoUsuario();
    }
  });
});

// Gestión de Tareas
let tareas = JSON.parse(localStorage.getItem('tareas') || '[]');
let filtro = "todas";
let editandoId = null;
const formTarea = document.getElementById('formTarea');

if(formTarea){
  formTarea.addEventListener('submit', function(e) {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value;
    const descripcion = document.getElementById('descripcion').value;
    const responsable = document.getElementById('responsable').value;
    const fecha = document.getElementById('fecha').value;
    const prioridad = document.getElementById('prioridad').value;
    if (editandoId) {
      const tarea = tareas.find(t => t.id === editandoId);
      if (tarea) {
        tarea.titulo = titulo;
        tarea.descripcion = descripcion;
        tarea.responsable = responsable;
        tarea.fecha = fecha;
        tarea.prioridad = prioridad;
        editandoId = null;
      }
    } else {
      const tarea = {
        id: Date.now(),
        titulo,
        descripcion,
        responsable,
        fecha,
        prioridad,
        estado: 'Pendiente'
      };
      tareas.push(tarea);
    }
    guardarTareas();
    actualizarListado();
    refreshReportes();
    formTarea.reset();
  });
}

function guardarTareas() {
  localStorage.setItem('tareas', JSON.stringify(tareas));
}

function actualizarListado() {
  const ul = document.getElementById('listaTareas');
  if(!ul) return;
  ul.innerHTML = '';
  let mostrar = tareas;
  if (filtro !== 'todas') {
    mostrar = tareas.filter(t => t.estado === filtro);
  }
  const noTareas = document.getElementById('noTareas');
  if(noTareas) noTareas.style.display = mostrar.length === 0 ? "block" : "none";
  mostrar.forEach(tarea => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>
        <strong>${tarea.titulo}</strong> 
        <span class="estado ${tarea.estado}">${tarea.estado}</span>
        <small class="desc" style="color:#666;display:block;">${tarea.descripcion}</small>
        <small class="responsable" style="color:#594;">Resp: ${tarea.responsable}</small>
        <small style="color:#666;">${tarea.fecha}</small>
        <span class="estado ${tarea.prioridad}">${tarea.prioridad}</span>
      </span>
      <div>
        <button class="btn-cambiar" onclick="cambiarEstado(${tarea.id})">Siguiente estado</button>
        <button class="btn-editar" onclick="editarTarea(${tarea.id})">Editar</button>
        <button class="btn-eliminar" onclick="eliminarTarea(${tarea.id})">Eliminar</button>
      </div>
    `;
    ul.appendChild(li);
  });
  refreshReportes();
}

const estados = ['Pendiente', 'Progreso', 'Completada'];
window.cambiarEstado = function(id) {
  const tarea = tareas.find(t => t.id === id);
  if (tarea) {
    let i = estados.indexOf(tarea.estado);
    tarea.estado = estados[(i+1)%estados.length];
    guardarTareas();
    actualizarListado();
  }
  refreshReportes();
};

window.editarTarea = function(id) {
  const tarea = tareas.find(t => t.id === id);
  if (tarea) {
    document.getElementById('titulo').value = tarea.titulo;
    document.getElementById('descripcion').value = tarea.descripcion;
    document.getElementById('responsable').value = tarea.responsable;
    document.getElementById('fecha').value = tarea.fecha;
    document.getElementById('prioridad').value = tarea.prioridad;
    editandoId = tarea.id;
  }
};

window.eliminarTarea = function(id) {
  tareas = tareas.filter(t => t.id !== id);
  guardarTareas();
  actualizarListado();
  refreshReportes();
};

// Filtros de tareas
document.querySelectorAll('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('selected'));
    this.classList.add('selected');
    filtro = this.dataset.estado;
    actualizarListado();
  });
});

// Gestión de Empleados
let empleados = JSON.parse(localStorage.getItem('empleados') || '[]');
let editandoEmpleadoId = null;
const formEmpleado = document.getElementById('formEmpleado');

if(formEmpleado){
  formEmpleado.addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombreEmpleado').value;
    const cargo = document.getElementById('cargoEmpleado').value;
    const email = document.getElementById('emailEmpleado').value;
    if(editandoEmpleadoId){
      const emp = empleados.find(e => e.id === editandoEmpleadoId);
      if(emp){
        emp.nombre = nombre;
        emp.cargo = cargo;
        emp.email = email;
        editandoEmpleadoId = null;
      }
    }else{
      empleados.push({id: Date.now(), nombre, cargo, email});
    }
    guardarEmpleados();
    refreshEmpleados();
    formEmpleado.reset();
  });
}

function guardarEmpleados(){
  localStorage.setItem('empleados', JSON.stringify(empleados));
}

function refreshEmpleados(){
  const tbody = document.getElementById('listaEmpleados');
  const noEmpleados = document.getElementById('noEmpleados');
  if(!tbody) return;
  tbody.innerHTML = '';
  if(empleados.length === 0){
    if(noEmpleados) noEmpleados.style.display = "block";
  }else{
    if(noEmpleados) noEmpleados.style.display = "none";
    empleados.forEach(emp => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${emp.nombre}</td>
        <td>${emp.cargo}</td>
        <td>${emp.email}</td>
        <td>
          <button class="btn-editarEmpleado" onclick="editarEmpleado(${emp.id})">Editar</button>
          <button class="btn-eliminarEmpleado" onclick="eliminarEmpleado(${emp.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
  refreshReportes();
}

window.editarEmpleado = function(id){
  const emp = empleados.find(e => e.id === id);
  if(emp){
    document.getElementById('nombreEmpleado').value = emp.nombre;
    document.getElementById('cargoEmpleado').value = emp.cargo;
    document.getElementById('emailEmpleado').value = emp.email;
    editandoEmpleadoId = id;
  }
};

window.eliminarEmpleado = function(id){
  empleados = empleados.filter(e => e.id !== id);
  guardarEmpleados();
  refreshEmpleados();
  refreshReportes();
};

// Reportes
function refreshReportes(){
  const reporteTotal = document.getElementById('reporteTotal');
  const reportePendiente = document.getElementById('reportePendiente');
  const reporteProgreso = document.getElementById('reporteProgreso');
  const reporteCompletada = document.getElementById('reporteCompletada');
  if(reporteTotal) reporteTotal.textContent = tareas.length;
  if(reportePendiente) reportePendiente.textContent = tareas.filter(t => t.estado === "Pendiente").length;
  if(reporteProgreso) reporteProgreso.textContent = tareas.filter(t => t.estado === "Progreso").length;
  if(reporteCompletada) reporteCompletada.textContent = tareas.filter(t => t.estado === "Completada").length;
  const empleadosReporte = document.getElementById('empleadosReporte');
  if(empleadosReporte){
    empleadosReporte.innerHTML = '';
    empleados.forEach(emp => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${emp.nombre}</td><td>${emp.cargo}</td><td>${emp.email}</td>`;
      empleadosReporte.appendChild(row);
    });
  }
}

// Exportar a Excel
const btnExportar = document.getElementById('btnExportarExcel');
if(btnExportar){
  btnExportar.addEventListener('click', function(){
    let ws_data = [["Titulo","Descripcion","Responsable","Fecha","Prioridad","Estado"]];
    tareas.forEach(t=>{
      ws_data.push([t.titulo, t.descripcion, t.responsable, t.fecha, t.prioridad, t.estado]);
    });
    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb,ws,"Tareas");
    XLSX.writeFile(wb,"tareas_taskflow.xlsx");
  });
}

// Cambio de contraseña
const formCambiarClave = document.getElementById('formCambiarClave');
if (formCambiarClave) {
  formCambiarClave.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const claveActualVal = document.getElementById('claveActual').value;
    const claveNuevaVal = document.getElementById('claveNueva').value;
    
    // Validaciones
    if (claveNuevaVal.length < 6) {
      mostrarMensajeClave("La nueva contraseña debe tener al menos 6 caracteres", "err");
      return;
    }
    
    let u = usuarios.find(u => u.usuario === usuarioActivo);
    if (u && claveActualVal === u.pass) {
      u.pass = claveNuevaVal;
      mostrarMensajeClave("✅ Contraseña cambiada correctamente", "ok");
      
      // Limpiar formulario
      document.getElementById('claveActual').value = "";
      document.getElementById('claveNueva').value = "";
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        document.getElementById('cambioClaveMsg').style.display = "none";
      }, 3000);
      
    } else {
      mostrarMensajeClave("❌ Contraseña actual incorrecta", "err");
    }
  });
}

// Inicialización
window.onload = actualizarListado;