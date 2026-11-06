import { NavLink, useLocation } from 'react-router-dom'

/*
 * A navigation link that is current on its own page only.
 *
 * `end` is the point: without it NavLink also marks /software as current on
 * /software/get-started, and the BioTSR menu shows two current items. With
 * it, exactly one menu entry matches any address, because no menu entry has
 * a #fragment (navigation.js, and a test, hold the menus to that). A section
 * of a page is tracked by that page's own "On this page" navigation, not here.
 *
 * `section` lists pages that belong under this entry without being menu
 * entries themselves (Learn BioTSR's lesson and notebook). On those pages the
 * link gets the class "in-section": marked as the page's section, but not
 * aria-current, because it is not the page; the page's breadcrumb names it.
 *
 * `className` takes the same ({ isActive }) => string function NavLink does.
 */
export default function MenuLink({ to, section, className, children, ...props }) {
  const { pathname } = useLocation()
  const inSection = section?.includes(pathname) ?? false

  /*
   * NavLink adds "active" to a string className by itself, but not to a
   * function's result; this keeps that behaviour for both forms.
   */
  const classes = (state) => {
    const base =
      typeof className === 'function'
        ? className(state)
        : [className, state.isActive && 'active'].filter(Boolean).join(' ')
    return inSection ? [base, 'in-section'].filter(Boolean).join(' ') : base
  }

  return (
    <NavLink to={to} end className={classes} {...props}>
      {children}
    </NavLink>
  )
}
