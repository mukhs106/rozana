// Short cooking clips, generated for Rozana, each with one job to do on Today.
export const CLIPS = [
  {
    key: "tadka",
    title: "Tempering the tadka",
    job: "Bloom mustard seeds and curry leaves in ghee until they crackle, about 30 seconds, before the spinach goes in.",
    posterUrl:
      "https://media.base44.com/images/public/6afc4c5847751139d9832e6d/005c66f6b_generated_image.png",
    videoUrl:
      "https://media.base44.com/videos/public/6afc4c5847751139d9832e6d/cad540541_Tempering_Tadka.mp4",
  },
  {
    key: "tofu",
    title: "Browning tofu",
    job: "Leave the cubes alone until each side is golden, so they hold together when they meet the gravy.",
    posterUrl:
      "https://media.base44.com/images/public/6afc4c5847751139d9832e6d/29bf2264b_generated_image.png",
    videoUrl:
      "https://media.base44.com/videos/public/6afc4c5847751139d9832e6d/9ce16b0a4_Browning_Tofu.mp4",
  },
  {
    key: "portion",
    title: "Portioning dinner and lunch",
    job: "Fill tomorrow's lunchbox before the second helping, while the pan is still hot and the portions are even.",
    posterUrl:
      "https://media.base44.com/images/public/6afc4c5847751139d9832e6d/20b3f53b6_generated_image.png",
    videoUrl:
      "https://media.base44.com/videos/public/6afc4c5847751139d9832e6d/5c8aa7c8a_Portioning_Dinner.mp4",
  },
];

/** One clip a day, so the same tip does not greet someone twice in a row. */
export function clipForToday(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date - start) / 86400000);
  return CLIPS[day % CLIPS.length];
}