import Link from 'next/link';

type BrandProps = {
  href?: string;
  className?: string;
};

export default function Brand({ href = '/', className = '' }: BrandProps) {
  return (
    <Link href={href} className={`logo ${className}`.trim()}>
      <span className="logo-mark" />
      RoomUNAP
    </Link>
  );
}
