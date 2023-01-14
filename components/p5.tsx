import dynamic from 'next/dynamic'

export const P5 = dynamic(
  async () => import('react-p5-wrapper').then((mod) => mod.ReactP5Wrapper),
  { ssr: false }
)