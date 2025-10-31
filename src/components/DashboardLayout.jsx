"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, ShoppingCart, Users, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    { icon: ShoppingCart, label: "Total Orders", value: "1,234", change: "+12.5%" },
    { icon: Users, label: "Total Customers", value: "5,678", change: "+8.2%" },
    { icon: TrendingUp, label: "Revenue", value: "$45,231", change: "+23.1%" },
    { icon: BarChart3, label: "Conversion Rate", value: "3.24%", change: "+1.2%" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Top Navbar */}
        <DashboardNavbar />

        {/* Page Content */}
        <main className="p-6">
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="mt-2 text-muted-foreground">Welcome back! Here's your business overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <Card key={index} className="border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">{stat.label}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stat.change} from last month</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Recent Orders</CardTitle>
                  <CardDescription>Your latest 5 orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((order) => (
                      <div
                        key={order}
                        className="flex items-center justify-between border-b border-border pb-4 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-foreground">Order #{1000 + order}</p>
                          <p className="text-sm text-muted-foreground">2 hours ago</p>
                        </div>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          Completed
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Top Products</CardTitle>
                  <CardDescription>Best selling products this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((product) => (
                      <div
                        key={product}
                        className="flex items-center justify-between border-b border-border pb-4 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-foreground">Product {product}</p>
                          <p className="text-sm text-muted-foreground">{100 * product} units sold</p>
                        </div>
                        <span className="font-semibold text-foreground">${(99.99 * product).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
