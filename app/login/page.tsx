import { loginWithGoogle } from "@/actions/auth";

export default function LoginPage() {
	return (
		<div className="flex h-screen w-full items-center justify-center bg-gray-50">
			<div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 bg-white p-10 shadow-xl">
				<div className="text-center">
					<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
						JnaninYoga
					</h2>
					<p className="mt-2 text-sm text-gray-600">Digital Command Center</p>
				</div>

				<form action={loginWithGoogle} className="mt-8 space-y-6">
					<button
						type="submit"
						className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
					>
						Sign in with Google
					</button>
				</form>
			</div>
		</div>
	);
}
