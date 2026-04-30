import { toast, Slide } from 'react-toastify'

const base = {
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  transition: Slide,
}

/**
 * Same shape as the old MUI `setNotice` payload: `{ type, message }`.
 * Empty message dismisses all toasts.
 */
export function notify(payload) {
  if (!payload || !String(payload.message || '').trim()) {
    toast.dismiss()
    return
  }
  const { type, message } = payload
  const msg = String(message)
  const t = String(type || 'info').toLowerCase()
  if (t === 'success') toast.success(msg, { ...base, autoClose: 3800 })
  else if (t === 'error') toast.error(msg, { ...base, autoClose: 6500 })
  else if (t === 'warning') toast.warning(msg, { ...base, autoClose: 12000 })
  else toast.info(msg, { ...base, autoClose: 4500 })
}
