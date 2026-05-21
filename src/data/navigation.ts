// ── Навигация ──────────────────────────────────────────
// Источник: scripts/data/site-options.json (menus: corporate-3, footer-menu-1/2)

export interface NavItem {
  title:     string;
  url:       string;
  external?: boolean;
  children?: NavItem[];
}

export const servicesDropdownNav: NavItem[] = [
  { title: 'Стрижка питомцев',            url: '/services/strizhka-sobak/' },
  { title: 'Экспресс-линька для собак',   url: '/services/ekspress-linka-dlya-sobak/' },
  { title: 'Гигиена для собак',           url: '/services/gigiena-dlya-sobak/' },
  { title: 'SPA-процедуры для собак',     url: '/services/spa-procedury-dlya-sobak/' },
  { title: 'Мытье и сушка собак',         url: '/services/myte-i-sushka-sobak/' },
  { title: 'Полный комплекс для собак',   url: '/services/polnyy-kompleks-dlya-sobak/' },
  { title: 'Чистка зубов собакам',        url: '/services/chistka-zubov-sobakam/' },
  { title: 'Стрижка когтей собакам',      url: '/services/strizhka-kogtey-sobakam/' },
  { title: 'Груминг для щенков',          url: '/services/gruming-dlya-shhenkov/' },
  { title: 'Полный комплекс для кошек',   url: '/services/polnyy-kompleks-dlya-koshek/' },
  { title: 'Стрижка когтей кошкам',       url: '/services/strizhka-kogtey-koshkam/' },
  { title: 'SPA-процедуры для кошек',     url: '/services/spa-procedury-dlya-koshek/' },
  { title: 'Экспресс-линька для кошек',   url: '/services/ekspress-linka-dlya-koshek/' },
  { title: 'Мытье и сушка кошек',         url: '/services/myte-i-sushka-koshek/' },
];

// Главное меню (corporate-3)
export const mainNav: NavItem[] = [
  { title: 'Главная',  url: '/' },
  {
    title: 'Услуги',
    url: '/services/',
    children: servicesDropdownNav,
  },
  { title: 'Цены',     url: '/prices/' },
  { title: 'Блог',     url: '/blog/' },
  { title: 'О нас',    url: '/about/' },
  { title: 'Контакты', url: '/contact/' },
];

// Кнопка «Записаться» в шапке — внешняя запись (dikidi)
export const bookingUrl = 'https://dikidi.ru/#widget=187143';

// Подвал — колонка «Услуги» (footer-menu-1)
export const footerServicesNav: NavItem[] = [
  { title: 'Стрижка собак',              url: '/services/strizhka-sobak/' },
  { title: 'Полный комплекс для собак',  url: '/services/polnyy-kompleks-dlya-sobak/' },
  { title: 'Чистка зубов собакам',       url: '/services/chistka-zubov-sobakam/' },
  { title: 'SPA-процедуры для собак',    url: '/services/spa-procedury-dlya-sobak/' },
  { title: 'Мытье и сушка собак',        url: '/services/myte-i-sushka-koshek/' },
  { title: 'Гигиена для собак',          url: '/services/gigiena-dlya-sobak/' },
  { title: 'Мытье и сушка кошек',        url: '/services/myte-i-sushka-koshek/' },
  { title: 'SPA-процедуры для кошек',    url: '/services/spa-procedury-dlya-koshek/' },
  { title: 'Полный комплекс для кошек',  url: '/services/polnyy-kompleks-dlya-koshek/' },
  { title: 'Экспресс-линька для кошек',  url: '/services/ekspress-linka-dlya-koshek/' },
  { title: 'Стрижка когтей',             url: '/services/strizhka-kogtey-sobakam/' },
];

// Подвал — колонка «О студии» (footer-menu-2)
export const footerAboutNav: NavItem[] = [
  { title: 'Студия',                     url: '/about/' },
  { title: 'Наши мастера',               url: '/masters/' },
  { title: 'Подарочный сертификат',      url: '/podarochnye-sertifikaty/' },
  { title: 'Контакты',                   url: '/contact/' },
  { title: 'Реквизиты',                  url: '/requisites/' },
  { title: 'Договор публичной оферты',   url: '/public-oferta/' },
  { title: 'Правила посещения студии',   url: '/rools/' },
];

// Для обратной совместимости с компонентами, использующими footerNav
export const footerNav: NavItem[] = footerAboutNav;
