export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-subtle ${className}`}>
      Kim Lân là câu lạc bộ giải trí dùng xu ảo. Xu không phải tiền, không nạp,
      không rút, không quy đổi ra tiền thật. Chơi để giải trí.
    </p>
  );
}
