export default function Page({ params }: { params: { routes: string } }) {
    return <h1>My Page{params.routes}</h1>
  }