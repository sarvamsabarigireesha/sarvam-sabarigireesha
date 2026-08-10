const menu=document.querySelector('.menu'),nav=document.querySelector('#nav');
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open)});
document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const blessings=[
"May every step you take today bring you closer to wisdom, devotion, and inner peace.",
"May Lord Ayyappa keep your heart steady, your path clear, and your lamp ever bright.",
"Swamiye Sharanam Ayyappa — may devotion guide every decision and every journey.",
"May the sacred eighteen steps remind you that every outer climb begins within."
];
document.querySelector('#newBlessing')?.addEventListener('click',()=>{
 const el=document.querySelector('#blessingText');
 const current=el.textContent.replace(/[“”]/g,'');
 let next=blessings[Math.floor(Math.random()*blessings.length)];
 if(blessings.length>1 && next===current) next=blessings[(blessings.indexOf(next)+1)%blessings.length];
 el.textContent=`“${next}”`;
});
