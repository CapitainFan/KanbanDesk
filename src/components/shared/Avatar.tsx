import { useState } from 'react'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' }

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name ?? 'User avatar'}
        className={`${sizes[size]} rounded-full object-cover`}
        onError={() => setImgError(true)}
      />
    )
  }

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div
      className={`${sizes[size]} rounded-full bg-blue-600 text-white flex items-center justify-center font-medium`}
    >
      {initials}
    </div>
  )
}