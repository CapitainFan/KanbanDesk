import { Layout } from '../components/shared/Layout'
import { BoardList } from '../components/board/BoardList'

export function DashboardPage() {
  return (
    <Layout>
      <BoardList />
    </Layout>
  )
}