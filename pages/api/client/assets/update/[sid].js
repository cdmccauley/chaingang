import clientPromise from "../../../../../lib/mongodb";

import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const resolves = {
    ACCEPTED: () => res.status(202).send(),
    NO_CONTENT: () => res.status(204).send(),
    BAD_REQUEST: () => res.status(400).send(),
    UNAUTHORIZED: () => res.status(401).send(),
    NOT_FOUND: () => res.status(404).send(),
    CONFLICT: () => res.status(409).send(),
    INTERNAL_SERVER_ERROR: () => res.status(500).send(),
  };

  let resolve = resolves.BAD_REQUEST;

  const sid = req?.query?.sid;

  try {
    if (sid) {
      resolve = resolves.ACCEPTED;

      const mongo = await clientPromise;
      const frontend = await mongo.db("frontend");
      const participants = await frontend.collection("participants");

      const date = new Date();

      const participant = await participants.findOne({
        sid: sid,
      });

      if (
        participant &&
        (!participant?.updates?.assets_update?.epoch ||
          participant?.updates?.assets_update?.epoch <=
            date.valueOf() - 1800000)
      ) {
        let unlocks = [];
        const discord = await frontend.collection("discord");

        let addresses = await discord
          .find(
            { "participant.sid": sid },
            {
              sort: { updated: -1 },
              projection: { _id: 0, address: 1 },
            }
          )
          .limit(1)
          .toArray();

        if (addresses.length === 0) {
          const twitch = await frontend.collection("twitch");
          addresses = await twitch
            .find(
              { "participant.sid": sid },
              {
                sort: { updated: -1 },
                projection: { _id: 0, address: 1 },
              }
            )
            .limit(1)
            .toArray();
        }

        if (addresses.length === 0) {
          const spotify = await frontend.collection("spotify");
          addresses = await spotify
            .find(
              { "participant.sid": sid },
              {
                sort: { updated: -1 },
                projection: { _id: 0, address: 1 },
              }
            )
            .limit(1)
            .toArray();
        }

        if (addresses.length > 0) {
          const address = addresses[0]?.address;

          if (address) {
            const loopring = await mongo.db("loopring");
            const snapshots = await loopring.collection("snapshots");

            const assets = await snapshots
              .find(
                {
                  $text: {
                    $search: address,
                    $caseSensitive: false,
                  },
                },
                { projection: { _id: 0 } }
              )
              .toArray();

            if (assets?.length > 0) {
              const gates = await loopring.collection("assets");

              let parsed = {};

              for (let i = 0; i < assets.length; i++) {
                const sources = await gates
                  .find({
                    active: true,
                    nftDatas: assets[i].nftData,
                  })
                  .toArray();

                if (sources?.length > 0) {
                  for (let j = 0; j < sources.length; j++) {
                    if (parsed[`${sources[j].display_name}`]) {
                      parsed[`${sources[j].display_name}`].assets = [
                        ...parsed[`${sources[j].display_name}`].assets,
                        { nftData: assets[i].nftData, total: assets[i].amount },
                      ];
                    } else {
                      parsed[`${sources[j].display_name}`] = {
                        rules: sources[j].rules,
                        nftDatas: sources[j].nftDatas,
                        assets: [
                          {
                            nftData: assets[i].nftData,
                            total: assets[i].amount,
                          },
                        ],
                      };
                    }
                  }
                }
              }

              if (Object.keys(parsed).length > 0) {
                for (let k = 0; k < Object.keys(parsed).length; k++) {
                  const group = Object.keys(parsed)[k];
                  if (parsed[`${group}`]?.rules?.length > 0) {
                    for (let l = 0; l < parsed[`${group}`].rules.length; l++) {
                      if (parsed[`${group}`].rules[l]?.subject) {
                      } else if (parsed[`${group}`].rules[l]?.of == "each") {
                        if (parsed[`${group}`]?.assets?.length > 0) {
                          if (parsed[`${group}`].nftDatas?.length > 0) {
                            // nftDatas is rule, assets is held
                            // map over rule assets as we're checking for all
                            const matches = parsed[`${group}`].nftDatas
                              .map((n) =>
                                // find match in user assets
                                // can apply n without unique here?
                                // - when each n becomes total of each
                                // - each takes precedent over unique
                                parsed[`${group}`].assets.find(
                                  (a) =>
                                    a.nftData == n &&
                                    Number.isInteger(
                                      Number.parseInt(a?.total)
                                    ) &&
                                    Number.parseInt(a.total) >=
                                      parsed[`${group}`].rules[l]?.n
                                )
                              )
                              .filter((m) => m);
                            if (
                              matches.length ==
                              parsed[`${group}`].nftDatas.length
                            ) {
                              unlocks = [
                                ...unlocks,
                                parsed[`${group}`].rules[l].unlock,
                              ];
                            }
                          }
                        }
                      } else if (parsed[`${group}`].rules[l]?.of == "any") {
                        if (parsed[`${group}`]?.assets?.length > 0) {
                          if (parsed[`${group}`].nftDatas?.length > 0) {
                            // nftDatas is rule, assets is held
                            // map over user assets as we're checking for any
                            const matches = parsed[`${group}`].assets
                              .map((n) =>
                                // find matches in rule assets
                                parsed[`${group}`].nftDatas.find(
                                  (a) => a == n.nftData
                                )
                              )
                              .filter((m) => m);

                            // when any and unique n becomes total of all
                            if (
                              parsed[`${group}`].rules[l]?.unique &&
                              matches.length >= parsed[`${group}`].rules[l]?.n
                            ) {
                              unlocks = [
                                ...unlocks,
                                parsed[`${group}`].rules[l].unlock,
                              ];
                              // if not unique, any is any match
                              // - maybe n becomes a total
                              // - if so, sort by amount and get the most held
                            } else if (matches.length > 0) {
                              unlocks = [
                                ...unlocks,
                                parsed[`${group}`].rules[l].unlock,
                              ];
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        await participants.updateOne(
          {
            _id: new ObjectId(participant._id),
          },
          {
            $set: {
              unlocks: unlocks,
              updates: {
                assets_update: {
                  utc: date.toUTCString(),
                  epoch: date.valueOf(),
                },
                asset_get: {},
              },
              files: [],
            },
          }
        );
      }
    }
  } catch (e) {
    console.error("API/CLIENT/ASSETS/UPDATE ERROR", e);
    resolve = resolves.INTERNAL_SERVER_ERROR;
  } finally {
    resolve();
  }
}
