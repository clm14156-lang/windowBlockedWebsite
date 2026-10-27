// Explicitly matched to the inspected files. The rabbit pair has different stems.
const art = (name, size = 800) => ({ src: `/assets/juese/${name}.png`, webp: `/assets/juese/${name}.webp`, width: size, height: size });
export const focusCharacters = [
  { id: 'girl', name: '静心少女', artwork: { day: art('white_gril01'), night: art('dark_gril01') } },
  { id: 'boy', name: '静心少年', artwork: { day: art('white_boy01'), night: art('dark_boy01') } },
  { id: 'leisure', name: '休闲女孩', artwork: { day: art('white_leisuregril'), night: art('dark_leisuregril') } },
  { id: 'fox', name: '禅坐狐狸', artwork: { day: art('white_fox'), night: art('dark_fox') } },
  { id: 'koala', name: '小考拉', artwork: { day: art('white_koala'), night: art('dark_koala', 1254) } },
  { id: 'littlefox', name: '小狐狸', artwork: { day: art('white_littlefox'), night: art('dark_littlefox') } },
  { id: 'rabbit', name: '垂耳兔', artwork: { day: art('white_littlerabbit'), night: art('dark_rabbit') } },
];
