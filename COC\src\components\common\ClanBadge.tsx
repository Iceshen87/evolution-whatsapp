export default function ClanBadge({
  url,
  name,
  size = 'md',
}: {
  url: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
  }

  return (
    <img
      src={url}
      alt={name}
      className={`${sizeClasses[size]} object-contain`}
    />
  )
}
