import { useState, useEffect } from 'react'

export default function NoSSR({ children }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isMounted ? children : null
}