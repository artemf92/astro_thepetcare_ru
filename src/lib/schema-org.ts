/**
 * JSON-LD для Organization, шапки, подвала и навигации (Schema.org).
 */
import { site } from '../data/site';
import type { NavItem } from '../data/navigation';
import {
  mainNav,
  footerServicesNav,
  footerAboutNav,
} from '../data/navigation';

export interface SiteJsonLdOptions {
  /** Базовый URL сайта, например https://thepetcare.ru/ */
  baseUrl:    string;
  /** Канонический URL текущей страницы */
  pageUrl:    string;
  /** Заголовок страницы (для WebPage), опционально */
  pageTitle?: string;
}

export interface ServiceJsonLdOptions {
  baseUrl:      string;
  /** Название услуги (используется в serviceType и в itemOffered.name) */
  serviceName:  string;
  /** Категория для OfferCatalog.name, напр. «Для собак». По умолчанию — «Услуги груминга». */
  category?:    string;
  /** Сырая строка цены из CMS, напр. «от 1600 ₽». Из неё извлекаются цифры. */
  price?:       string;
  /** Главное фото услуги (путь от корня сайта) */
  image?:       string;
  /** Канонический URL страницы услуги */
  pageUrl?:     string;
  /** Краткое описание услуги */
  description?: string;
}

function stripTrailingSlash(u: string): string {
  return u.replace(/\/+$/, '');
}

function absUrl(path: string, base: string): string {
  const normalizedBase = stripTrailingSlash(base);
  const p = path.startsWith('/') ? path : `/${path}`;
  return new URL(p, `${normalizedBase}/`).href;
}

function navToItemListElements(items: NavItem[], base: string) {
  return items.map((item, i) => ({
    '@type':    'ListItem' as const,
    position:   i + 1,
    name:       item.title,
    item:       absUrl(item.url, base),
  }));
}

/** Только пункты верхнего уровня главного меню (без раскрытия подменю услуг). */
function mainNavTopLevelItemList(base: string) {
  return mainNav.map((item, i) => ({
    '@type':  'ListItem' as const,
    position: i + 1,
    name:     item.title,
    item:     absUrl(item.url, base),
  }));
}

export function buildSiteJsonLd(opts: SiteJsonLdOptions) {
  const base = stripTrailingSlash(opts.baseUrl);
  const orgId = `${base}/#organization`;
  const websiteId = `${base}/#website`;
  const pageId = `${opts.pageUrl}#webpage`;
  const headerId = `${base}/#site-header`;
  const footerId = `${base}/#site-footer`;
  const navMainId = `${base}/#navigation-main`;
  const navFooterServicesId = `${base}/#navigation-footer-services`;
  const navFooterAboutId = `${base}/#navigation-footer-about`;

  const sameAs = [
    site.social.vk,
    site.social.telegram,
    site.social.instagram,
    site.social.youtube,
    site.social.whatsapp,
    site.social.doublegis,
  ].filter((u): u is string => Boolean(u && u.length));

  const organization = {
    '@type':       'LocalBusiness' as const,
    '@id':         orgId,
    name:          site.name,
    url:           `${base}/`,
    logo:          absUrl(site.logo.src, base),
    image:         absUrl(site.logo.src, base),
    description:   site.description,
    telephone:     site.contacts.phoneRaw,
    address:       {
      '@type':           'PostalAddress' as const,
      streetAddress:     site.contacts.address,
      addressLocality:   'Калининград',
      addressCountry:    'RU',
    },
    aggregateRating: {
      '@type':       'AggregateRating' as const,
      ratingValue:   5.0,
      reviewCount:   63,
      bestRating:    5,
      worstRating:   1,
    },
    openingHoursSpecification: [
      {
        '@type':     'OpeningHoursSpecification' as const,
        dayOfWeek:   [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens:  '10:00',
        closes: '19:00',
      },
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };

  const geo = {
    "@type": "GeoCoordinates" as const,
    "latitude": 54.7529,
    "longitude": 20.4957
  }

  const website = {
    '@type':       'WebSite' as const,
    '@id':         websiteId,
    url:           `${base}/`,
    name:          site.name,
    description:   site.description,
    inLanguage:    'ru-RU',
    publisher:     { '@id': orgId },
  };

  const mainNavList = {
    '@type':           'ItemList' as const,
    '@id':             navMainId,
    name:              'Основная навигация',
    numberOfItems:     mainNav.length,
    itemListElement:   mainNavTopLevelItemList(base),
  };

  const footerServicesList = {
    '@type':           'ItemList' as const,
    '@id':             navFooterServicesId,
    name:              'Услуги в подвале',
    numberOfItems:     footerServicesNav.length,
    itemListElement:   navToItemListElements(footerServicesNav, base),
  };

  const footerAboutList = {
    '@type':           'ItemList' as const,
    '@id':             navFooterAboutId,
    name:              'О студии в подвале',
    numberOfItems:     footerAboutNav.length,
    itemListElement:   navToItemListElements(footerAboutNav, base),
  };

  const header = {
    '@type': 'WPHeader' as const,
    '@id':   headerId,
    url:     `${base}/`,
  };

  const footer = {
    '@type': 'WPFooter' as const,
    '@id':   footerId,
    url:     `${base}/`,
  };

  // hasPart у WebPage допускает типы вроде WebPageElement (WPHeader, WPFooter);
  // ItemList здесь нельзя — валидаторы помечают как недопустимую цель.
  const webPage: Record<string, unknown> = {
    '@type':     'WebPage' as const,
    '@id':       pageId,
    url:         opts.pageUrl,
    isPartOf:    { '@id': websiteId },
    publisher:   { '@id': orgId },
    inLanguage:  'ru-RU',
    hasPart:     [{ '@id': headerId }, { '@id': footerId }],
  };

  if (opts.pageTitle) {
    webPage.name = opts.pageTitle;
  }

  return {
    '@context': 'https://schema.org',
    '@graph':   [
      organization,
      geo,
      website,
      webPage,
      header,
      footer,
      mainNavList,
      footerServicesList,
      footerAboutList,
    ],
  };
}

/**
 * Извлекает числовую цену из строки CMS вида «от 1600 ₽» → «1600».
 * Возвращает undefined, если цифр нет.
 */
function extractNumericPrice(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/\d[\d\s]*/);
  if (!match) return undefined;
  const digits = match[0].replace(/\s+/g, '');
  return digits.length ? digits : undefined;
}

export function buildServiceJsonLd(opts: ServiceJsonLdOptions) {
  const base = stripTrailingSlash(opts.baseUrl);
  const orgId = `${base}/#organization`;

  const price = extractNumericPrice(opts.price);

  const offer: Record<string, unknown> = {
    '@type':      'Offer',
    itemOffered:  {
      '@type': 'Service',
      name:    opts.serviceName,
    },
  };

  if (price) {
    offer.priceSpecification = {
      '@type':        'PriceSpecification',
      price,
      priceCurrency:  'RUB',
    };
  }

  const service: Record<string, unknown> = {
    '@context':    'https://schema.org',
    '@type':       'Service',
    serviceType:   opts.serviceName,
    name:          opts.serviceName,
    provider:      { '@id': orgId },
    areaServed:    {
      '@type': 'City',
      name:    'Калининград',
    },
    hasOfferCatalog: {
      '@type':           'OfferCatalog',
      name:              opts.category || 'Услуги груминга',
      itemListElement:   [offer],
    },
  };

  if (opts.image) {
    service.image = absUrl(opts.image, base);
  }
  if (opts.pageUrl) {
    service.url = opts.pageUrl;
  }
  if (opts.description) {
    service.description = opts.description;
  }

  return service;
}
