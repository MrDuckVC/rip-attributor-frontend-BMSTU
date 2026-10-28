interface Props { name: 'heart' | 'search' | 'trash' | 'next'; outline?: boolean }

export function Icon({ name, outline = false }: Props) {
  return (
    <svg aria-hidden="true" className="inner-icon" viewBox="0 0 24 24" fill={name === 'heart' && !outline ? 'currentColor' : 'none'} stroke={name === 'heart' && !outline ? 'none' : 'currentColor'} strokeWidth={name === 'next' || name === 'search' ? 3 : 2} strokeLinecap="round" strokeLinejoin="round">
      {name === 'heart' && <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />}
      {name === 'search' && <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>}
      {name === 'trash' && <path stroke="none" fill="currentColor" d="M7 21C6.45 21 5.97917 20.8042 5.5875 20.4125C5.19583 20.0208 5 19.55 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.8042 20.0208 18.4125 20.4125C18.0208 20.8042 17.55 21 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z" />}
      {name === 'next' && <path d="m6 9 6 6 6-6" />}
    </svg>
  )
}
