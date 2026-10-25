import { closeDialog, showConfirmDialog, showToast } from 'vant'

let dialogOpen = false

export function notify(message) {
  showToast({ message, position: 'bottom', className: 'snackbar', duration: 2500 })
}

export async function confirmAction(title, message, confirmButtonText, destructive = false) {
  dialogOpen = true
  try {
    await showConfirmDialog({ title, message, confirmButtonText, cancelButtonText: '取消', className: destructive ? 'md-dialog destructive' : 'md-dialog' })
    return true
  } catch { return false }
  finally { dialogOpen = false }
}

// Android back closes an open dialog first; the pending confirm is treated as cancelled.
export function dismissDialog() {
  if (!dialogOpen) return false
  dialogOpen = false
  closeDialog()
  return true
}

const rippleTargets = '.btn, .chip, .icon-btn, .fab, .nav-item, a.list-item, button.list-item, label.list-item, .segmented button, .cal-day, .star-btn'

export function installRipple() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  document.addEventListener('pointerdown', event => {
    const host = event.target.closest?.(rippleTargets)
    if (!host || host.disabled) return
    const target = host.classList.contains('nav-item') ? host.querySelector('.nav-ind') : host
    const box = target.getBoundingClientRect(), size = Math.hypot(box.width, box.height) * 2
    const wave = document.createElement('span')
    wave.className = 'ripple'
    wave.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - box.left - size / 2}px;top:${event.clientY - box.top - size / 2}px`
    target.append(wave)
    wave.addEventListener('animationend', () => wave.remove())
  }, { passive: true })
}
