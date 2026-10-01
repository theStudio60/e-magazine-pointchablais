import { getPack } from "@/lib/db";

export const dynamic = "force-dynamic";

const HTML = `
<style>
  :root{
    --blue:#1c6b8c;--blue-deep:#124f68;--blue-ink:#0e3f53;
    --mauve:#9c6b91;--mauve-deep:#7d5074;--mauve-soft:#f4ecf2;
    --ink:#243138;--muted:#6a7d83;--gray:#f4f6f6;--card:#fff;--line:#e5e9ea;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--card);color:var(--ink);
    font-family:"Poppins",system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
  .wrap{max-width:1140px;margin:0 auto;padding-inline:30px}
  @media(max-width:620px){.wrap{padding-inline:18px}}
  a{color:inherit;text-decoration:none}
  @keyframes fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes floatCover{0%,100%{transform:rotate(-4deg) translateY(0)}50%{transform:rotate(-4deg) translateY(-10px)}}
  @keyframes shine{0%{background-position:-140% 0}60%,100%{background-position:240% 0}}
  .fade{animation:fade .7s ease both}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;font-weight:600;font-size:15px;
    border:0;border-radius:6px;padding:14px 26px;cursor:pointer;position:relative;overflow:hidden;z-index:0;transition:transform .18s,box-shadow .18s}
  .btn:hover{transform:translateY(-2px)}

  /* header */
  header{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
  .head{display:flex;align-items:center;justify-content:space-between;padding-block:15px}
  .head img{height:42px}
  .head a.login{color:var(--blue-ink);font-weight:600;font-size:14.5px}
  .head a.login:hover{color:var(--mauve)}

  /* hero */
  .hero{position:relative;overflow:hidden;background:
    radial-gradient(120% 120% at 85% 10%,#1b6f92 0%,var(--blue-deep) 45%,var(--blue-ink) 100%);color:#eef5f7}
  .marks{position:absolute;inset:0;pointer-events:none;overflow:hidden;opacity:.13}
  .marks span{position:absolute;white-space:nowrap;font-weight:700;color:#fff;
    -webkit-text-stroke:1px rgba(255,255,255,.55);color:transparent;letter-spacing:.02em}
  .hero-in{position:relative;display:grid;grid-template-columns:1.08fr .92fr;gap:40px;align-items:center;padding:70px 0 78px}
  @media(max-width:880px){.hero-in{grid-template-columns:1fr;text-align:center;padding:48px 0 54px;gap:30px}}
  .hero .eye{display:inline-block;text-transform:uppercase;letter-spacing:.22em;font-size:11.5px;font-weight:600;
    color:#d8ecf2;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);
    padding:6px 14px;border-radius:999px;margin:0 0 20px}
  .hero h1{font-weight:700;font-size:clamp(32px,5vw,50px);line-height:1.08;margin:0 0 18px}
  .hero h1 b{color:#fff;font-weight:800}
  .hero p{color:#c8dde3;font-size:clamp(15.5px,1.8vw,18.5px);max-width:44ch;margin:0}
  @media(max-width:880px){.hero p{margin-inline:auto}}
  .cover-side{display:flex;justify-content:center}
  .stage{position:relative;width:min(360px,86%)}
  .stage .mag{width:100%;border-radius:6px;display:block;
    box-shadow:0 40px 70px -24px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.08);
    transform:rotate(-4deg);animation:floatCover 7s ease-in-out infinite}
  /* phone mockup — le magazine dans la poche */
  .phone{position:absolute;right:-38px;bottom:-34px;width:34%;aspect-ratio:9/19;
    background:#0e1418;border-radius:22px;padding:7px;
    box-shadow:0 26px 48px -18px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.12);
    transform:rotate(5deg);animation:floatPhone 7s ease-in-out infinite;z-index:2}
  .phone::before{content:"";position:absolute;top:9px;left:50%;transform:translateX(-50%);
    width:34%;height:5px;border-radius:6px;background:#2a343a;z-index:2}
  .phone .scr{width:100%;height:100%;border-radius:15px;overflow:hidden;background:#fff}
  .phone .scr img{width:100%;height:100%;object-fit:cover;object-position:top}
  /* badge flottant */
  .pill{position:absolute;left:-26px;top:22px;z-index:3;display:flex;align-items:center;gap:9px;
    background:rgba(255,255,255,.96);color:var(--blue-ink);border-radius:999px;padding:9px 15px 9px 11px;
    font-size:13px;font-weight:600;box-shadow:0 16px 30px -12px rgba(0,0,0,.5);
    animation:floatPill 6s ease-in-out infinite}
  .pill svg{flex:0 0 auto;color:var(--mauve)}
  @keyframes floatPhone{0%,100%{transform:rotate(5deg) translateY(0)}50%{transform:rotate(5deg) translateY(-12px)}}
  @keyframes floatPill{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes pulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.6);opacity:0}}
  @media(max-width:880px){.phone{right:-14px;bottom:-24px}.pill{left:-8px}}
  .wave{display:block;width:100%;height:auto;margin-top:-1px;margin-bottom:-1px}

  /* offres */
  .offres{background:var(--gray);padding:74px 0 84px}
  .offres .kick{text-align:center;text-transform:uppercase;letter-spacing:.2em;font-size:12px;font-weight:600;color:var(--mauve);margin:0 0 10px}
  .offres h2{text-align:center;font-weight:700;font-size:clamp(26px,3.6vw,36px);color:var(--blue-ink);margin:0 0 8px}
  .offres .sub{text-align:center;color:var(--muted);margin:0 auto 46px;font-size:15.5px;max-width:46ch}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:26px;max-width:820px;margin:0 auto;align-items:stretch}
  @media(max-width:680px){.grid{grid-template-columns:1fr;max-width:420px}}

  .card{background:var(--card);border-radius:18px;padding:36px 32px 34px;position:relative;
    border:1px solid var(--line);display:flex;flex-direction:column;
    transition:transform .28s cubic-bezier(.2,.7,.2,1),box-shadow .28s,border-color .28s}
  .card:hover{transform:translateY(-10px);box-shadow:0 30px 55px -28px rgba(14,63,83,.4);border-color:transparent}
  .card .plan{font-weight:600;font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 14px}
  .card .price{display:flex;align-items:flex-end;gap:8px;margin:0 0 4px}
  .card .price .amt{font-weight:800;font-size:46px;line-height:1;color:var(--blue-ink)}
  .card .price .cur{font-weight:600;font-size:16px;color:var(--muted);margin-bottom:7px}
  .card .per{color:var(--muted);font-size:14px;margin:0 0 24px}
  .feats{list-style:none;margin:0 0 28px;padding:22px 0 0;border-top:1px solid var(--line);display:grid;gap:12px}
  .feats li{display:flex;align-items:center;gap:11px;font-size:14.8px;color:var(--ink)}
  .feats svg{flex:0 0 auto}
  .card .btn{width:100%;margin-top:auto}
  .btn-blue{background:var(--blue);color:#fff;box-shadow:0 10px 22px -12px rgba(28,107,140,.8)}
  .btn-blue::after{content:"";position:absolute;inset:0;z-index:-1;background:var(--blue-deep);transform:translateY(101%);transition:transform .25s}
  .btn-blue:hover::after{transform:translateY(0)}
  .btn-mauve{background:var(--mauve);color:#fff;box-shadow:0 10px 22px -12px rgba(156,107,145,.85)}
  .btn-mauve::after{content:"";position:absolute;inset:0;z-index:-1;background:var(--mauve-deep);transform:translateY(101%);transition:transform .25s}
  .btn-mauve:hover::after{transform:translateY(0)}

  /* illustration devices dans les formules */
  .illus{height:132px;display:flex;align-items:flex-end;justify-content:center;position:relative;margin:-4px 0 20px}
  .card:hover .dv-mon,.card:hover .dv-phone{transform:translateY(-6px)}
  .dv-mon,.dv-phone{transition:transform .3s cubic-bezier(.2,.7,.2,1)}
  .dv-mon{width:158px}
  .dv-mon .screen{border:6px solid #263036;border-radius:9px;overflow:hidden;aspect-ratio:16/10;background:#fff;
    box-shadow:0 14px 26px -14px rgba(14,63,83,.45)}
  .dv-mon .screen img{width:100%;height:100%;object-fit:cover;object-position:center}
  .dv-mon .stand{width:32px;height:13px;margin:0 auto;background:linear-gradient(#c3cbce,#98a2a6)}
  .dv-mon .base{width:74px;height:5px;margin:2px auto 0;background:#98a2a6;border-radius:3px}
  .dv-phone{width:58px;aspect-ratio:9/19;background:#0e1418;border-radius:11px;padding:3px;
    box-shadow:0 14px 24px -12px rgba(14,63,83,.55)}
  .dv-phone .s{width:100%;height:100%;border-radius:8px;overflow:hidden;background:#fff}
  .dv-phone .s img{width:100%;height:100%;object-fit:cover;object-position:center}
  .illus.duo .dv-phone{position:absolute;left:calc(50% + 32px);bottom:0;width:52px;z-index:2}
  .illus.duo .dv-mon{transform:translateX(-14px)}
  .card:hover .illus.duo .dv-mon{transform:translateX(-14px) translateY(-6px)}
  .illus .plus{position:absolute;left:calc(50% - 96px);bottom:34px;width:30px;height:30px;border-radius:50%;
    background:var(--mauve);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:19px;
    box-shadow:0 10px 20px -8px rgba(156,107,145,.9);z-index:3}

  /* recommended */
  .card.feat{border:1.5px solid var(--mauve);box-shadow:0 24px 50px -30px rgba(125,80,116,.55)}
  .card.feat .amt{color:var(--mauve-deep)}
  .ribbon{position:absolute;top:-13px;left:50%;transform:translateX(-50%);
    background:linear-gradient(90deg,var(--mauve),var(--mauve-deep));color:#fff;font-weight:600;font-size:11.5px;
    letter-spacing:.08em;text-transform:uppercase;padding:7px 18px;border-radius:999px;
    box-shadow:0 8px 18px -8px rgba(125,80,116,.9);overflow:hidden}
  .ribbon::before{content:"";position:absolute;inset:0;
    background:linear-gradient(100deg,transparent 20%,rgba(255,255,255,.5) 50%,transparent 80%);
    background-size:220% 100%;animation:shine 3.6s ease-in-out infinite}

  /* footer */
  footer{background:#fff;border-top:1px solid var(--line);color:var(--muted)}
  .foot{display:flex;align-items:center;justify-content:space-between;gap:22px;flex-wrap:wrap;padding:26px 0}
  .foot .brand{display:flex;align-items:center;gap:14px}
  .foot .brand img{height:36px}
  .foot .brand span{font-size:13px;color:var(--muted)}
  .pays{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .pay{background:#fff;border:1px solid var(--line);color:#4a5b61;font-size:11px;font-weight:600;letter-spacing:.02em;
    border-radius:6px;padding:6px 9px;height:32px;display:inline-flex;align-items:center;gap:6px}
  .pay img{height:20px;width:auto;display:block}
  .foot-bottom{border-top:1px solid var(--line);text-align:center;padding:15px 0;font-size:12.5px}
  .foot-bottom a:hover{color:var(--blue)}
  .foot-bottom .sep{color:var(--line);margin:0 4px}
  @media(max-width:620px){
    .foot{flex-direction:column;justify-content:center;text-align:center;gap:16px;padding:28px 0 22px}
    .foot .brand{flex-direction:column;gap:8px}
    .foot .pays{justify-content:center}
    .foot-bottom{line-height:1.9;padding:16px 0 20px}
  }

  @media(prefers-reduced-motion:reduce){*{animation:none!important}.stage .mag{transform:rotate(-4deg)}.phone{transform:rotate(5deg)}}
</style>

<header>
  <div class="wrap head">
        <a href="/" aria-label="Accueil" style="display:flex"><img src="/logo.png" alt="Le Point Chablais"></a>
    <a class="login" href="/connexion">Se connecter</a>
  </div>
</header>

<section class="hero">
  <div class="marks">
    <span style="top:6%;left:-3%;font-size:70px;transform:rotate(-8deg)">Aigle</span>
    <span style="top:20%;left:60%;font-size:56px;transform:rotate(6deg)">Bex</span>
    <span style="top:38%;left:2%;font-size:60px;transform:rotate(-5deg)">Ollon</span>
    <span style="top:60%;left:34%;font-size:64px;transform:rotate(7deg)">Villeneuve</span>
    <span style="top:80%;left:-2%;font-size:54px;transform:rotate(-6deg)">Yvorne</span>
    <span style="top:12%;left:30%;font-size:48px;transform:rotate(4deg)">Leysin</span>
    <span style="top:52%;left:70%;font-size:50px;transform:rotate(-7deg)">Gryon</span>
    <span style="top:74%;left:62%;font-size:58px;transform:rotate(5deg)">Villars</span>
    <span style="top:30%;left:82%;font-size:44px;transform:rotate(-4deg)">Roche</span>
    <span style="top:88%;left:36%;font-size:46px;transform:rotate(6deg)">Corbeyrier</span>
  </div>
  <div class="wrap hero-in">
    <div class="fade">
      <span class="eye">Abonnement numérique</span>
      <h1>Le journal qui réunit <b>Aigle</b>,<br><b>Bex</b> et le Chablais.</h1>
      <p>Toute votre actualité régionale, désormais en version numérique — à lire dès sa parution, sur tous vos écrans.</p>
    </div>
    <div class="cover-side fade" style="animation-delay:.15s">
      <div class="stage">
        <img class="mag" src="/site.jpg" alt="Couverture du Point Chablais">
        <div class="phone"><div class="scr"><img src="/mobile.jpg" alt=""></div></div>
        <div class="pill">Nouveau numéro en ligne</div>
      </div>
    </div>
  </div>
  <svg class="wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true">
    <path fill="#f4f6f6" d="M0,40 C240,72 480,72 720,48 C960,24 1200,24 1440,44 L1440,70 L0,70 Z"></path>
  </svg>
</section>

<section class="offres" id="offres">
  <p class="kick">Nos formules</p>
  <h2>Choisissez votre abonnement</h2>
  <p class="sub">Le magazine en version numérique, sans engagement. Résiliable à tout moment.</p>
  <div class="grid">

    <div class="card">
      <div class="illus">
        <div class="dv-phone"><div class="s"><img src="/mobile.jpg" alt=""></div></div>
      </div>
      <p class="plan">Mensuel</p>
      <div class="price"><span class="amt">__PRIX_M__</span><span class="cur">CHF / mois</span></div>
      <p class="per">Facturé chaque mois</p>
      <ul class="feats">
        <li><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#e6f0f4"/><path d="M7 12.5l3 3 7-7" fill="none" stroke="#1c6b8c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Le magazine complet en numérique</li>
        <li><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#e6f0f4"/><path d="M7 12.5l3 3 7-7" fill="none" stroke="#1c6b8c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Lecture sur tous vos écrans</li>
        <li><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#e6f0f4"/><path d="M7 12.5l3 3 7-7" fill="none" stroke="#1c6b8c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Sans engagement</li>
      </ul>
      <a class="btn btn-blue" href="/inscription?plan=mensuel">Choisir le mensuel</a>
    </div>

    <div class="card feat">
      <span class="ribbon">Recommandé</span>
      <div class="illus duo">
        <div class="dv-mon"><div class="screen"><img src="/site.jpg" alt=""></div><div class="stand"></div><div class="base"></div></div>
        <div class="dv-phone"><div class="s"><img src="/mobile.jpg" alt=""></div></div>
        <span class="plus">+</span>
      </div>
      <p class="plan">Annuel</p>
      <div class="price"><span class="amt">__PRIX_A__</span><span class="cur">CHF / an</span></div>
      <p class="per">Soit un peu plus de 4.– par mois</p>
      <ul class="feats">
        <li><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#f2e6ef"/><path d="M7 12.5l3 3 7-7" fill="none" stroke="#9c6b91" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Tout le mensuel, à prix réduit</li>
        <li><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#f2e6ef"/><path d="M7 12.5l3 3 7-7" fill="none" stroke="#9c6b91" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Accès aux éditions précédentes</li>
        <li><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#f2e6ef"/><path d="M7 12.5l3 3 7-7" fill="none" stroke="#9c6b91" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Deux mois offerts sur l'année</li>
      </ul>
      <a class="btn btn-mauve" href="/inscription?plan=annuel">Choisir l'annuel</a>
    </div>

  </div>
</section>

<footer>
  <div class="wrap foot">
    <div class="brand"><img src="/logo.png" alt="Le Point Chablais"><span>Aigle, Bex et environs</span></div>
    <div class="pays">
      <span class="pay"><img src="/pay/visa.svg" alt="Visa"></span><span class="pay"><img src="/pay/mastercard.webp" alt="Mastercard"></span><span class="pay"><img src="/pay/twint.png" alt="TWINT"></span>
    </div>
  </div>
  <div class="wrap foot-bottom">
    © 2026 Le Point Chablais<span class="sep">·</span><a href="/conditions-vente">Conditions de vente</a><span class="sep">·</span><a href="/conditions-abonnement">Conditions d'abonnement</a><span class="sep">·</span><a href="/confidentialite">Politique de confidentialité</a>
  </div>
</footer>

`;

export default async function Home() {
  const m = String(Math.round(((await getPack("mensuel"))?.price ?? 500) / 100));
  const a = String(Math.round(((await getPack("annuel"))?.price ?? 4900) / 100));
  const html = HTML.replace("__PRIX_M__", m).replace("__PRIX_A__", a);
  return <main dangerouslySetInnerHTML={{ __html: html }} />;
}
