import { redirect } from 'next/navigation';

interface Props {
  params: { id: string };
  searchParams: { startlisteId?: string };
}

export default function GenerierenPage({ params, searchParams }: Props) {
  const { id } = params;
  const { startlisteId } = searchParams;
  
  let redirectUrl = `/startlisten-tool?id=${id}`;
  if (startlisteId) {
    redirectUrl += `&startlisteId=${startlisteId}`;
  }
  
  redirect(redirectUrl);
}