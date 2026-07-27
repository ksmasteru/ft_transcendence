interface LazyLoadingImageProps {
  children: React.ReactNode;
  dimension: { width: string; height: string };
  loading: boolean;
  color?: string;
}

export function LazyLoadingImage({
  children,
  dimension,
  loading,
  color = "bg-primary-bg/30",
}: LazyLoadingImageProps): JSX.Element {
  return (
    <div className={`relative`}>
      {children}
      {!loading && (
        <div
          className={`absolute inset-0 ${dimension.width} ${dimension.height} rounded-full backdrop-blur-md ${color} animate-pulse`}
        />
      )}
    </div>
  );
}
