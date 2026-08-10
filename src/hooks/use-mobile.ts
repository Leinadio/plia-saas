import * as React from "react"

const MOBILE_BREAKPOINT = 768

// La largeur en dessous de laquelle un panneau latéral n'a plus la place de vivre
// en colonne et doit s'ouvrir par-dessus le contenu. 768 par défaut (le seuil des
// tablettes en portrait), mais un panneau plus large peut demander le sien : celui
// du détail fait 26rem et étoufferait le tableau bien avant 768.
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < breakpoint)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return !!isMobile
}
