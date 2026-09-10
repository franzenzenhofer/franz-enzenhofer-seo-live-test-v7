export const bindMenu = (wrapper, onAction) => {
  const trigger = wrapper.querySelector('[data-menu-toggle]')
  const menu = wrapper.querySelector('[role="menu"]')
  const items = [...menu.querySelectorAll('[role="menuitem"]')]
  const close = (restoreFocus = false) => {
    menu.hidden = true; trigger.setAttribute('aria-expanded', 'false')
    if (restoreFocus) trigger.focus()
  }
  const open = (last = false) => {
    document.querySelectorAll('[data-actions]').forEach(other => {
      if (other !== wrapper) { other.querySelector('[role="menu"]').hidden = true; other.querySelector('[data-menu-toggle]').setAttribute('aria-expanded', 'false') }
    })
    menu.hidden = false; trigger.setAttribute('aria-expanded', 'true'); items[last ? items.length - 1 : 0].focus()
  }
  trigger.addEventListener('click', () => menu.hidden ? open() : close(true))
  trigger.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); open(event.key === 'ArrowUp') }
  })
  menu.addEventListener('keydown', event => {
    const index = items.indexOf(document.activeElement)
    if (event.key === 'Escape') { event.preventDefault(); close(true) }
    else if (event.key === 'Tab') close()
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
      items[next].focus()
    }
  })
  items.forEach(item => item.addEventListener('click', () => { close(true); onAction(item.dataset.action) }))
}
// Bind once; rerendered cards do not accumulate document listeners.
document.addEventListener('pointerdown', event => {
  document.querySelectorAll('[data-actions]').forEach(wrapper => {
    if (!wrapper.contains(event.target)) {
      wrapper.querySelector('[role="menu"]').hidden = true
      wrapper.querySelector('[data-menu-toggle]').setAttribute('aria-expanded', 'false')
    }
  })
})
