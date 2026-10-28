# A gyógyszer-emlékeztető PWA, ami nem akar felejteni – hibariport

Repó: https://github.com/felhasznalo/umfst-bh06-gyogyszer-pwa
Készítette: Csiszer Alpar, Info_LM 3. ev

## 1. hiba
- **Hiba leírása és reprodukálása (DevTools Application panel képernyőképekkel):** 
  A Lighthouse PWA audit jelzi, hogy a manifest nem felel meg a telepíthetőségi feltételeknek, mert a start_url nem létező vagy eltérő útvonalra mutat.
- **Gyökérok:** 
  A manifestben `/index.htm` szerepelt, míg a valódi fájl `/index.html` volt.
- **Javítás (commit link):** 
  Módosítva a manifestben: `"start_url": "/index.html"`.
- **Hogyan tesztelted (Lighthouse PWA, offline mód, „Update on reload”, cache-tartalom ellenőrzése):** 
  Lighthouse PWA audit futtatása Chrome DevTools-ban.
- **Tanulság / érintett alapelv:** 
  A manifest konfigurációs útvonalainak pontosan egyezniük kell a szerverfájlok strukturális elnevezéseivel.

## 2. hiba
- **Hiba leírása és reprodukálása (DevTools Application panel képernyőképekkel):** 
  Chrome-ban nem jelent meg a „Telepítés” (Install) gomb az address bar-ban.
- **Gyökérok:** 
  Az ikon definícióból hiányzott a kötelező `sizes` attribútum (pl. `"192x192 512x512"`).
- **Javítás (commit link):** 
  Kiegészítve a manifest ikon objektumát a `sizes` mezővel.
- **Hogyan tesztelted (Lighthouse PWA, offline mód, „Update on reload”, cache-tartalom ellenőrzése):** 
  Lighthouse PWA panel ellenőrzése.
- **Tanulság / érintett alapelv:** 
  A telepíthető PWA-knak szigorú manifest követelményeknek (ikonméretek, start_url, display) kell megfelelniük.

## 3. hiba
- **Hiba leírása és reprodukálása (DevTools Application panel képernyőképekkel):** 
  A konzolban időnként `Response body is already used` vagy `Failed to execute 'put' on 'Cache'` hiba jelent meg.
- **Gyökérok:** 
  A fetch válasz (`resp`) streambol ki lett olvasva a kliens felé, így közvetlenül nem volt újra felhasználható a `cache.put()` hívásban klónozás nélkül.
- **Javítás (commit link):** 
  Alkalmaztuk a `resp.clone()` metódust a cache-be helyezés előtt.
- **Hogyan tesztelted (Lighthouse PWA, offline mód, „Update on reload”, cache-tartalom ellenőrzése):** 
  Console panel felügyelete és frissítések tesztelése.
- **Tanulság / érintett alapelv:** 
  A Fetch API válaszai egyszer olvasható adatfolyamok (streams), ezért többszörös felhasználáshoz klónozni kell őket.

## 4. hiba
- **Hiba leírása és reprodukálása (DevTools Application panel képernyőképekkel):** 
  A szerveren módosított adagolás (`adagok.json`) sosem jelent meg a felhasználóknál, a régi adatok maradtak betöltve.
- **Gyökérok:** 
  Az API kérésekre is Cache-First stratégiát alkalmazott a Service Worker, így a hálózatot meg sem kereste a böngésző, ha volt cache-elt válasz.
- **Javítás (commit link):** 
  Különválasztottuk a stratégiákat: az `/api/` útvonalakra **Network-First** stratégiát vezettünk be.
- **Hogyan tesztelted (Lighthouse PWA, offline mód, „Update on reload”, cache-tartalom ellenőrzése):** 
  Adatok módosítása és offline/online váltás tesztelése.
- **Tanulság / érintett alapelv:** 
  Erőforrás-típusonként eltérő cache-stratégia szükséges (App Shell: Cache-First, Dinamikus adatok/API: Network-First).

## 5. hiba
- **Hiba leírása és reprodukálása (DevTools Application panel képernyőképekkel):** 
  Offline módban vagy gyenge hálózaton a lista örökre „Betöltés…” állapotban ragadt, hibaüzenet nélkül.
- **Gyökérok:** 
  Hiányzott a `.catch()` ág a JavaScript fetch láncból, így hiba esetén a felület nem frissült.
- **Javítás (commit link):** 
  Hozzáadtunk egy hibaezelő ágat (`.catch`), amely vizuális visszajelzést ad a felhasználónak.
- **Hogyan tesztelted (Lighthouse PWA, offline mód, „Update on reload”, cache-tartalom ellenőrzése):** 
  DevTools Network panel -> Offline mód bekapcsolása.
- **Tanulság / érintett alapelv:** 
  Aszinkron műveleteknél mindig gondoskodni kell a hibakezelésről (Robustness / Fokozatos bővítés).

## 6. hiba
- **Hiba leírása és reprodukálása (DevTools Application panel képernyőképekkel):** 
  A SW regisztráció nem a megfelelő hatókörrel (scope) futott, mert alulmappából (`/js/sw.js`) regisztrálták.
- **Gyökérok:** 
  A Service Worker fájl elhelyezkedése korlátozta a scope-ot, hacsak explicit módon nem deklaráljuk.
- **Javítás (commit link):** 
  A SW regisztrációnál explicit megadtuk a scope-ot (`{ scope: '/' }`), és a gyökérbe helyeztük.
- **Hogyan tesztelted (Lighthouse PWA, offline mód, „Update on reload”, cache-tartalom ellenőrzése):** 
  Application -> Service Workers panel ellenőrzése.
- **Tanulság / érintett alapelv:** 
  A Service Worker hatóköre alapértelmezésben a saját mappájától függ, ezért célszerű a gyökérben elhelyezni.

## 7. hiba
- **Hiba leírása és reprodukálása (DevTools Application panel képernyőképekkel):** 
  Az első telepítés után néha teljesen hiányoztak az ikonok a cache-ből, mert egyetlen hálózati hiba megszakította a folyamatot.
- **Gyökérok:** 
  A `cache.addAll()` atomikus művelet: ha egyetlen elem letöltése is meghiúsul, az egész cache-elés meghiúsul.
- **Javítás (commit link):** 
  Iteratív, hibatűrő cache-elést implementáltunk (`Promise.all` + egyedi `cache.put` try-catch ágakkal).
- **Hogyan tesztelted (Lighthouse PWA, offline mód, „Update on reload”, cache-tartalom ellenőrzése):** 
  Application -> Cache Storage tartalmának vizsgálata.
- **Tanulság / érintett alapelv:** 
  A kritikus erőforrások cache-elésénél érdemes robustus, hibatűrő megoldásokat alkalmazni.

## Összegzés
- Mit tanultam: A PWA fejlesztés során a manifest szabványok betartása, a megfelelő cache-stratégiák megválasztása (Network-First vs Cache-First) és a robusztus aszinkron hibakezelés kulcsfontosságú a stabil működéshez.
- Melyik alapelv sérült a leggyakrabban: Megfelelő cache-stratégia erőforrás-típusonként, valamint a hálózati hibák kezelése.
