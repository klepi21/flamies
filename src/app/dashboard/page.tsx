import {
  AuthRedirectWrapper } from '@/wrappers';
import { ClientHooks } from '@/components/ClientHooks';
import CharacterSelection from './choose';



export default function Dashboard() {
  return (
    <>
      <ClientHooks />
      <AuthRedirectWrapper>
        <div className='flex flex-col gap-6 max-w-3xl w-full'>
          <CharacterSelection />
        </div>
      </AuthRedirectWrapper>
    </>
  );
}
