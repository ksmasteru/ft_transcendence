import { useState } from "react";
import { MdCheck, MdClose } from "react-icons/md";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { useDashboardContext } from "../../Pages/Dashboard";
import { API_BASE_URL } from "../../config";

export function NotificationsSection(): JSX.Element {
  const { user, friendRequests, markNotificationAsRead, fetchFriendRequests } =
    useDashboardContext();
  const onMarkAsRead = markNotificationAsRead;
  const onRequestUpdate = fetchFriendRequests;
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [loadedAvatars, setLoadedAvatars] = useState<Set<string>>(new Set());

  const handleAccept = async (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/friends/${requestId}/accept`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept friend request");
      }

      // Mark as read and refresh the list
      onMarkAsRead(requestId);
      onRequestUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to accept friend request");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/friends/${requestId}/decline`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to decline friend request");
      }

      // Mark as read and refresh the list
      onMarkAsRead(requestId);
      onRequestUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to decline friend request");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-white text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="bg-primary-bg min-h-screen w-full text-white font-primary p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Notifications</h2>
          <p className="text-white/70">Manage your friend requests</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 text-rose-200">
            {error}
          </div>
        )}

        {friendRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">No pending friend requests</p>
            <p className="text-white/40 text-sm mt-2">
              When someone sends you a friend request, it will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">
              Friend Requests ({friendRequests.length})
            </h3>
            {friendRequests.map((request) => {
              const isProcessing = processingIds.has(request.requestId);
              const initials = request.from.name
                ? request.from.name
                    .split(" ")
                    .map((n: string) => n.charAt(0))
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : request.from.email.charAt(0).toUpperCase();

              return (
                <div
                  key={request.requestId}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-primary-elements hover:border-primary-btn transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {request.from.avatar ? (
                        <LazyLoadingImage
                          dimension={{
                            width: "w-14",
                            height: "h-14",
                          }}
                          loading={loadedAvatars.has(request.requestId)}
                          color="bg-primary-btn/30"
                        >
                          <img
                            src={request.from.avatar}
                            alt={request.from.name}
                            className={`w-14 h-14 rounded-full object-cover border-2 border-primary-btn transition-opacity duration-300 ${loadedAvatars.has(request.requestId) ? "opacity-100" : "opacity-0"}`}
                            loading="lazy"
                            onLoad={() =>
                              setLoadedAvatars((prev) =>
                                new Set(prev).add(request.requestId)
                              )
                            }
                            onError={() =>
                              setLoadedAvatars((prev) =>
                                new Set(prev).add(request.requestId)
                              )
                            }
                          />
                        </LazyLoadingImage>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary-btn/30 border-2 border-primary-btn flex items-center justify-center text-lg font-semibold">
                          {initials}
                        </div>
                      )}
                      {request.from.avatar &&
                        !loadedAvatars.has(request.requestId) && (
                          <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
                        )}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{request.from.name}</p>
                      <p className="text-sm text-white/60">{request.from.email}</p>
                      <p className="text-xs text-white/40 mt-1">
                        {new Date(request.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.requestId)}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <MdCheck size={20} />
                      {isProcessing ? "Processing..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleDecline(request.requestId)}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 hover:bg-rose-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <MdClose size={20} />
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
