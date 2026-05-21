// ── Глобальные данные сайта ────────────────────────────

export const site = {
  name:        'ThePetCare.ru',
  description: 'Профессиональная стрижка собак и кошек в Калининграде',
  url:         'https://thepetcare.ru',

  contacts: {
    phone:    '+7 (902) 416-99-59',
    phoneRaw: '+79024169959',
    email:    '',
    address:  'г. Калининград, ул. И. Сусанина, д. 24',
  },

  social: {
    vk:        'http://vk.com/thepetcare',
    telegram:  'https://t.me/the_petcare',
    instagram: 'https://instagram.com/thepetcare/',
    youtube:   '',
    whatsapp:  'https://wa.me/79024169959',
  },

  booking: 'https://dikidi.ru/#widget=187143',

  logo: {
    src:    '/images/uploads/11640.webp',
    alt:    'ThePetCare.ru — груминг в Калининграде',
    width:  160,
    height: 52,
  }
} as const;
