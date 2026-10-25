import { revealObservation } from './archiveNavigation';

interface ObservationLinkProps {
  id: number;
}

export default function ObservationLink({ id }: ObservationLinkProps) {
  return (
    <a
      href={`#obs-${id}`}
      aria-label={`跳转到第 ${id} 条观察`}
      onClick={(event) => {
        event.preventDefault();
        revealObservation(id);
      }}
      className="inline-flex h-11 w-11 items-center justify-center border border-line bg-cardok font-mono2 text-[12px] text-mute transition-colors hover:border-acc hover:text-acc-deep focus-visible:border-acc md:h-9 md:w-9"
    >
      {String(id).padStart(2, '0')}
    </a>
  );
}
