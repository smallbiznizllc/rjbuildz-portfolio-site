"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateSocialAccountsAction } from "@/app/admin/actions/settings";
import { SocialIcon } from "@/components/social/SocialIcon";
import {
  SOCIAL_NETWORKS,
  getSocialNetwork,
  resolveSocialHref,
  type SocialNetworkId,
} from "@/lib/social/networks";
import type { SocialAccount } from "@/types";

export type SocialAccountItem = {
  id: string;
  network: SocialNetworkId;
  handle: string;
  href: string;
  sortOrder: number;
};

interface SocialAccountsFormProps {
  initial: SocialAccountItem[];
}

function toItems(accounts: SocialAccount[]): SocialAccountItem[] {
  return [...accounts]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((account, index) => ({
      ...account,
      sortOrder: index,
    }));
}

export function SocialAccountsForm({ initial }: SocialAccountsFormProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialAccountItem[]>(() =>
    toItems(initial),
  );
  const [saved, setSaved] = useState<SocialAccountItem[]>(() =>
    toItems(initial),
  );
  const [network, setNetwork] = useState<SocialNetworkId>("instagram");
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  const placeholder = useMemo(
    () => getSocialNetwork(network).placeholder,
    [network],
  );

  function persist(next: SocialAccountItem[]) {
    const payload = next.map((account, index) => ({
      ...account,
      sortOrder: index,
    }));
    setAccounts(payload);
    startTransition(async () => {
      const result = await updateSocialAccountsAction(payload);
      if (!result.ok) {
        toast.error(result.error);
        setAccounts(saved);
        return;
      }
      setSaved(payload);
      toast.success("Social accounts saved");
      router.refresh();
    });
  }

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    let href = "";
    try {
      href = resolveSocialHref(network, value);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enter a valid URL or handle",
      );
      return;
    }

    const duplicate = accounts.some(
      (account) => account.network === network && account.href === href,
    );
    if (duplicate) {
      toast.error("That account is already listed");
      return;
    }

    persist([
      ...accounts,
      {
        id: crypto.randomUUID(),
        network,
        handle: value.trim(),
        href,
        sortOrder: accounts.length,
      },
    ]);
    setValue("");
  }

  function handleRemove(id: string) {
    persist(accounts.filter((account) => account.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <form
        onSubmit={handleAdd}
        className="rounded-lg border border-zinc-200 bg-white p-5 sm:p-6"
      >
        <p className="text-sm text-zinc-600">
          Choose a network, then paste a profile URL or handle. Icons appear in
          the footer under RJ Buildz.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[11rem_1fr_auto] sm:items-end">
          <div>
            <label
              htmlFor="social-network"
              className="mb-1 block text-sm font-medium text-zinc-800"
            >
              Network
            </label>
            <select
              id="social-network"
              value={network}
              onChange={(e) => setNetwork(e.target.value as SocialNetworkId)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
            >
              {SOCIAL_NETWORKS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="social-handle"
              className="mb-1 block text-sm font-medium text-zinc-800"
            >
              URL or handle
            </label>
            <input
              id="social-handle"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
            />
          </div>
          <button
            type="submit"
            disabled={pending || !value.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden />
            Add
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {accounts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">
            No social accounts yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {accounts.map((account) => {
              const spec = getSocialNetwork(account.network);
              return (
                <li
                  key={account.id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-800">
                    <SocialIcon network={account.network} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900">
                      {spec.label}
                    </p>
                    <a
                      href={account.href}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm text-zinc-500 hover:text-[#b87333]"
                    >
                      {account.handle}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(account.id)}
                    disabled={pending}
                    className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 disabled:opacity-50"
                    aria-label={`Remove ${spec.label}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
