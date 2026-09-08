import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/orders/$orderId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/orders/$orderId"!</div>
}
