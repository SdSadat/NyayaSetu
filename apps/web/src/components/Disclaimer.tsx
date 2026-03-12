export default function Disclaimer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-dark-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <p className="text-center text-xs leading-relaxed text-gray-500">
          <span className="font-medium text-gray-400">Disclaimer:</span>{' '}
          NyayaSetu provides legal <em>information</em> for educational purposes
          only. It does not constitute legal advice, and no lawyer-client
          relationship is formed. For situation-specific guidance, please consult
          a qualified legal professional. All information is sourced from
          publicly available bare acts, court judgments, and government
          notifications.
        </p>
      </div>
    </footer>
  );
}
