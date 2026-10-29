// core: porovnanie mzdy a dividendy zo slovenskej s.r.o. v roku 2026.
// Čisté funkcie, žiadny prístup k DOM. index.html ich načíta ako ES modul,
// v Node sa dajú importovať z testu s príponou .mjs.

// Zaokrúhlenie na centy. Mzdové veličiny sa počítajú v centoch, nie v plávajúcej čiarke.
const c = (x) => Math.round(x * 100) / 100;

export const SADZBY = {
  // Odvody zamestnanca: 9,4 % sociálne + 5 % zdravotné = 14,4 %
  ZAM_SOC: 0.094,
  ZAM_ZDRAV: 0.05,
  // Odvody zamestnávateľa: 25,2 % sociálne + 11 % zdravotné = 36,2 %
  FIRMA_SOC: 0.252,
  FIRMA_ZDRAV: 0.11,
  // Maximálny vymeriavací základ pre sociálne poistenie. Zdravotné strop nemá.
  MAX_VZ_SOC: 16764,
  // Nezdaniteľná časť základu dane na daňovníka
  NCZD_MES: 497.23,
  NCZD_ROCNY_LIMIT: 26083.13,
  NCZD_VZOREC: 14661.11,
  // Daňový bonus na dieťa
  BONUS_DO15: 100,
  BONUS_15_18: 50,
  BONUS_ZD_LIMIT: 2286,
  // Percentuálny strop bonusu podľa počtu detí (§ 33 ods. 6)
  BONUS_STROP: [0, 0.29, 0.36, 0.43, 0.5, 0.57, 0.64],
  // Progresívne pásma dane z príjmu, mesačný základ dane
  PASMA: [
    [3665.28, 0.19],
    [5029.1, 0.25],
    [6250.86, 0.3],
    [Infinity, 0.35],
  ],
  // Zrážková daň z dividendy zo zisku za obdobia od 1. 1. 2025
  DIVIDENDA: 0.07,
  MIN_MZDA: 915,
};

// Stravné sa mení od 1. 12. 2026 (oznámenie MPSVR SR č. 255/2026 Z. z.).
// Príspevok zamestnávateľa je 55 % stravného pri tuzemskej ceste 5 až 12 hodín.
export const STRAVNE = {
  do_11_2026: { popis: "Do 30. 11. 2026", zaklad: 9.3, listok: 6.98, min: 3.84, max: 5.12 },
  od_12_2026: { popis: "Od 1. 12. 2026", zaklad: 9.8, listok: 7.35, min: 4.05, max: 5.39 },
};

// Daň z príjmu podľa progresívnych pásiem.
export function danZoZakladu(zakladDane) {
  let dan = 0;
  let spodok = 0;
  for (const [strop, sadzba] of SADZBY.PASMA) {
    if (zakladDane <= spodok) break;
    dan += (Math.min(zakladDane, strop) - spodok) * sadzba;
    spodok = strop;
  }
  return c(dan);
}

// Nezdaniteľná časť sa pri vyšších príjmoch kráti a nad istou hranicou zaniká.
export function nczd(ciastkovyZaklad) {
  const rocny = ciastkovyZaklad * 12;
  if (rocny <= SADZBY.NCZD_ROCNY_LIMIT) return SADZBY.NCZD_MES;
  return c(Math.max(0, (SADZBY.NCZD_VZOREC - rocny / 3) / 12));
}

// Daňový bonus. Kráti sa dvakrát: percentom zo základu dane pri nízkom príjme
// a o 1/10 sumy nad limitom pri vysokom príjme.
export function danovyBonus(ciastkovyZaklad, detiDo15, deti15az18) {
  const pocet = detiDo15 + deti15az18;
  if (pocet === 0) return { suma: 0, kratenyStropom: false, kratenyPrijmom: false };

  const zrazka = Math.max(0, ciastkovyZaklad - SADZBY.BONUS_ZD_LIMIT) / 10;
  const naDieta = (zakladnaSuma) => Math.max(0, zakladnaSuma - zrazka);
  const plny = detiDo15 * naDieta(SADZBY.BONUS_DO15) + deti15az18 * naDieta(SADZBY.BONUS_15_18);
  const strop = SADZBY.BONUS_STROP[Math.min(pocet, 6)] * ciastkovyZaklad;

  return {
    suma: c(Math.min(plny, strop)),
    kratenyStropom: strop < plny,
    kratenyPrijmom: zrazka > 0,
  };
}

// Kompletný výpočet jedného mesiaca.
// mzda = hrubá mzda, stravnePoDen = príspevok zamestnávateľa, dni = pracovné dni.
export function vypocet({ mzda, detiDo15 = 0, deti15az18 = 0, stravnePoDen = 0, dni = 20 }) {
  const vzSoc = Math.min(mzda, SADZBY.MAX_VZ_SOC);

  const zamSoc = c(vzSoc * SADZBY.ZAM_SOC);
  const zamZdrav = c(mzda * SADZBY.ZAM_ZDRAV);
  const ciastkovyZaklad = c(Math.max(0, mzda - zamSoc - zamZdrav));

  const odpocet = nczd(ciastkovyZaklad);
  const zakladDane = c(Math.max(0, ciastkovyZaklad - odpocet));
  const dan = danZoZakladu(zakladDane);

  const bonus = danovyBonus(ciastkovyZaklad, detiDo15, deti15az18);
  const cistaMzda = c(mzda - zamSoc - zamZdrav - dan + bonus.suma);

  const firmaSoc = c(vzSoc * SADZBY.FIRMA_SOC);
  const firmaZdrav = c(mzda * SADZBY.FIRMA_ZDRAV);
  const stravne = c(stravnePoDen * dni);

  // Náklady firmy sú daňovo uznané, takže z nich nejde daň z príjmu PO ani zrážková daň.
  const naklady = c(mzda + firmaSoc + firmaZdrav + stravne);
  // Stravné do zákonného limitu je u zamestnanca oslobodené od dane aj odvodov.
  const vrecko = c(cistaMzda + stravne);
  const efektivna = naklady > 0 ? 1 - vrecko / naklady : 0;

  return {
    mzda,
    zamSoc,
    zamZdrav,
    zamOdvody: c(zamSoc + zamZdrav),
    ciastkovyZaklad,
    nczd: odpocet,
    zakladDane,
    dan,
    bonus: bonus.suma,
    bonusKratenyStropom: bonus.kratenyStropom,
    bonusKratenyPrijmom: bonus.kratenyPrijmom,
    cistaMzda,
    firmaSoc,
    firmaZdrav,
    firmaOdvody: c(firmaSoc + firmaZdrav),
    stravne,
    naklady,
    vrecko,
    efektivna,
  };
}

// Efektívne zdanenie dividendy: najprv daň z príjmu PO, potom zrážková daň.
export function efektivnaDividenda(danPO) {
  return 1 - (1 - danPO) * (1 - SADZBY.DIVIDENDA);
}

// Z rovnakých nákladov firmy vyplatených ako dividenda.
export function dividendaZNakladov(naklady, danPO) {
  return c(naklady * (1 - danPO) * (1 - SADZBY.DIVIDENDA));
}

// Najvyššia hrubá mzda, pri ktorej je mzda ešte aspoň taká výhodná ako dividenda.
export function bodZvratu({ detiDo15 = 0, deti15az18 = 0, stravnePoDen = 0, dni = 20, danPO = 0.1 }) {
  const cielova = efektivnaDividenda(danPO);
  let posledna = null;
  for (let mzda = 200; mzda <= 6000; mzda += 1) {
    const r = vypocet({ mzda, detiDo15, deti15az18, stravnePoDen, dni });
    if (r.efektivna <= cielova) posledna = mzda;
  }
  return posledna;
}
