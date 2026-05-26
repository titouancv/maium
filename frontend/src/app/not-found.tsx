import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex h-dvh items-center justify-center">
      <Image
        src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHVhdmxxNjl5ZjY1bTh3OTVxYmVxeW1qamszazBraTZhcnFxdDN6NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/f7N10M1qz4I2M29DNP/giphy.gif"
        alt="404"
        width={480}
        height={270}
        unoptimized
      />
    </div>
  );
}
