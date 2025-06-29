/*****************************************************************
 *  PadelMatch –  UX mejorado + ENTER para añadir jugador +
 *  Formateo de nombre (primera letra mayúscula)
 *****************************************************************/

/* ---------- Traducciones ---------- */
const i18n={
  es:{newTab:"Nueva pestaña",reset:"Reset / Nuevo evento",createEvent:"Crear Parranda / Torneo (Dobles)",create:"Crear",playerReg:"Registro de jugadores",genCalendar:"Generar calendario",ranking:"Ranking"},
  en:{newTab:"New tab",reset:"Reset / New event",createEvent:"Create Match / Tournament (Doubles)",create:"Create",playerReg:"Player registration",genCalendar:"Generate schedule",ranking:"Leaderboard"}
};
let lang="es";

/* ---------- Variables del torneo ---------- */
let jugadores=[], eventoNombre="", rondas=[], resultados={};

const $=id=>document.getElementById(id);
const encodeKey=([a1,a2,b1,b2])=>`${a1}&${a2}|${b1}&${b2}`;
const decodeKey=k=>{const[tA,tB]=k.split("|");return[...tA.split("&"),...tB.split("&")];};

/* ---------- Persistencia ---------- */
function save(){sessionStorage.setItem("padelmatch",JSON.stringify({eventoNombre,jugadores,rondas,resultados,lang}));}
function load(){const d=JSON.parse(sessionStorage.getItem("padelmatch"));if(!d)return;({eventoNombre,jugadores,rondas,resultados,lang}=d);}

/* ---------- Traducción ---------- */
const t=k=>i18n[lang][k]||k;
function applyTranslations(){
  document.querySelectorAll("[data-t]").forEach(el=>el.textContent=t(el.dataset.t));
  $("langTxt").textContent=lang==="es"?"EN":"ES";
}

/* ---------- Lucide ---------- */
function initLucide(){lucide.createIcons();}

/* ---------- Botones globales ---------- */
$("btnNueva").onclick=()=>window.open(location.href,"_blank");
$("btnReset").onclick=()=>{if(confirm("¿Reset?")){sessionStorage.clear();location.reload();}};
$("langBtn").onclick=()=>{lang=lang==="es"?"en":"es";applyTranslations();save();};

/* ---------- Crear evento ---------- */
$("crearBtn").onclick=crearEvento;
function crearEvento(){
  const n=$("nombreEvento").value.trim();
  if(!n)return alert("Nombre?");
  eventoNombre=n;
  $("nombreEventoActual").textContent=`${t("createEvent")}: ${eventoNombre}`;
  $("crear-evento").style.display="none";
  $("registro-jugadores").style.display="block";
  save();initLucide();
}

/* ---------- Helpers de nombre ---------- */
const formatName=str=>{
  str=str.trim();
  return str?str[0].toUpperCase()+str.slice(1).toLowerCase():str;
};

/* ---------- Jugadores ---------- */
$("addPlayerBtn").onclick=agregarJugador;
/* NUEVO → Enter en el input agrega jugador */
$("nombreJugador").addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();agregarJugador();}
});

function agregarJugador(){
  let n=$("nombreJugador").value;
  n=formatName(n);
  if(!n)return;
  if(jugadores.map(j=>j.toLowerCase()).includes(n.toLowerCase()))return alert("Ese jugador ya está");
  jugadores.push(n);
  $("nombreJugador").value="";
  pintarJugadores();save();initLucide();
}
function pintarJugadores(){
  const ul=$("listaJugadores");ul.innerHTML="";
  jugadores.forEach(j=>{
    const li=document.createElement("li");li.textContent=j;ul.appendChild(li);
  });
}

/* ---------- Calendario ---------- */
$("genRndBtn").onclick=generarRondas;
function generarRondas(){
  const nR=+$("numRondas").value;if(nR<1)return alert("Rondas?");
  if(jugadores.length!==4)return alert("Solo 4 jugadores en esta demo");
  rondas=[];for(let r=0;r<nR;r++){rondas.push(genPartidos(jugadores));}
  resultados={};pintarRondas();actualizarRanking();$("ranking").style.display="block";save();initLucide();
}
const genPartidos=p=>[[p[0],p[1],p[2],p[3]],[p[0],p[2],p[1],p[3]],[p[0],p[3],p[1],p[2]]]; // 3 únicos

/* ---------- Pintar rondas ---------- */
/* ---------- Pintar rondas (inputs con clase score-input) ---------- */
function pintarRondas() {
  const cont = $("rondasContainer");
  cont.innerHTML = "";

  rondas.forEach((matches, idxR) => {
    /* título de la ronda */
    const h3 = document.createElement("h3");
    h3.textContent = `${t("ranking")} R${idxR + 1}`;
    cont.appendChild(h3);

    const ul = document.createElement("ul");
    ul.id = `ulR${idxR}`;
    cont.appendChild(ul);

    /* cada partido de la ronda */
    matches.forEach((m, idxM) => {
      const key = encodeKey(m);
      const li  = document.createElement("li");
      ul.appendChild(li);

      li.innerHTML = `
        ${m[0]} & ${m[1]} <strong>vs</strong> ${m[2]} & ${m[3]}
        <input type="number" class="score-input" min="0"
               placeholder="Games ${m[0]}-${m[1]}"
               value="${resultados[key]?.gA ?? ""}">
        <input type="number" class="score-input" min="0"
               placeholder="Games ${m[2]}-${m[3]}"
               value="${resultados[key]?.gB ?? ""}">
      `;

      /* registrar resultado al cambiar cualquier input */
      li.querySelectorAll("input").forEach(inp =>
        inp.onchange = () => registrar(key, li)
      );
    });
  });
}

/* ---------- Registrar resultado ---------- */
function registrar(key,li){
  const inp=li.querySelectorAll("input");
  const gA=parseInt(inp[0].value),gB=parseInt(inp[1].value);
  if(Number.isNaN(gA)||Number.isNaN(gB))return;
  resultados[key]={gA,gB};actualizarRanking();save();
}

/* ---------- Ranking ---------- */
function actualizarRanking(){
  const stats={};jugadores.forEach(j=>stats[j]={vict:0,games:0});
  Object.entries(resultados).forEach(([k,{gA,gB}])=>{
    const [a1,a2,b1,b2]=decodeKey(k);
    if(gA>gB){stats[a1].vict++;stats[a2].vict++;}else if(gB>gA){stats[b1].vict++;stats[b2].vict++;}
    stats[a1].games+=gA;stats[a2].games+=gA;stats[b1].games+=gB;stats[b2].games+=gB;
  });
  const ord=Object.entries(stats).sort((a,b)=>b[1].vict-a[1].vict||b[1].games-a[1].games);
  let html=`<tr><th>#</th><th>${t("playerReg")}</th><th>V</th><th>G</th></tr>`;
  ord.forEach(([j,s],i)=>html+=`<tr><td>${i+1}</td><td>${j}</td><td>${s.vict}</td><td>${s.games}</td></tr>`);
  $("tablaRanking").innerHTML=html;
}

/* ---------- Inicio ---------- */
window.onload=()=>{
  load();applyTranslations();
  if(eventoNombre){$("nombreEventoActual").textContent=`${t("createEvent")}: ${eventoNombre}`;$("crear-evento").style.display="none";$("registro-jugadores").style.display="block";}
  pintarJugadores();if(rondas.length){pintarRondas();actualizarRanking();$("ranking").style.display="block";}
  initLucide();
};
