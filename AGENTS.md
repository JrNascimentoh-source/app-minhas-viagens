<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Centralize net earnings, advances and outstanding balance in src/lib/payments.ts so records, statistics and PDF reports never double-count advances.
- Store completion separately from registration timestamps; editing departure updates trip_date and period together so calendar grouping stays consistent.
- Reuse TripEditor for completed-trip actions on home and calendar; destructive actions require explicit confirmation and remain scoped to the authenticated owner.
