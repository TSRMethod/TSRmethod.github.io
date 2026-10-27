import { NavLink } from 'react-router-dom'

/*
 * A navigation link that is current on its own page only.
 *
 * `end` is the point: without it NavLink also marks /software as current on
 * /software/get-started, and the BioTSR menu shows two current items. With
 * it, exactly one menu entry matches any address, because no menu entry has
 * a #fragment (navigation.js, and a test, hold the menus to that). A section
 * of a page is tracked by that page's own "On this page" navigation, not here.
 *
 * `className` takes the same ({ isActive }) => string function NavLink does.
 */
export default function MenuLink({ to, className, children, ...props }) {
  return (
    <NavLink to={to} end className={className} {...props}>
      {children}
    </NavLink>
  )
}
